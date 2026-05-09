import httpx
from app.core.database import supabase, settings
from app.services.ai_service import extract_knowledge
from app.services.knowledge_service import save_knowledge_nodes_batch
import hashlib


# ─────────────────────────────────────────
# NOTION API HELPER
# ─────────────────────────────────────────

async def notion_api_call(
    endpoint: str,
    method: str = "GET",
    body: dict = None
) -> dict:
    """Make a call to Notion API"""

    headers = {
        "Authorization": f"Bearer {settings.notion_api_key}",
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        if method == "GET":
            response = await client.get(
                f"https://api.notion.com/v1/{endpoint}",
                headers=headers
            )
        else:
            response = await client.post(
                f"https://api.notion.com/v1/{endpoint}",
                headers=headers,
                json=body or {}
            )

        return response.json()


# ─────────────────────────────────────────
# GET ALL PAGES
# ─────────────────────────────────────────

async def get_all_pages() -> list[dict]:
    """Search for all pages in workspace"""

    data = await notion_api_call(
        "search",
        method="POST",
        body={
            "filter": {"value": "page", "property": "object"},
            "sort": {"direction": "descending", "timestamp": "last_edited_time"},
            "page_size": 50
        }
    )

    if data.get("status") == 401:
        print("Notion API key invalid")
        return []

    pages = data.get("results", [])
    print(f"Found {len(pages)} Notion pages")
    return pages


# ─────────────────────────────────────────
# GET PAGE CONTENT
# ─────────────────────────────────────────

async def get_page_content(page_id: str) -> str:
    """Extract text content from a Notion page"""

    # Get page blocks
    data = await notion_api_call(
        f"blocks/{page_id}/children?page_size=100"
    )

    if not data.get("results"):
        return ""

    blocks = data.get("results", [])
    text_parts = []

    for block in blocks:
        block_type = block.get("type", "")
        block_data = block.get(block_type, {})

        # Extract text from different block types
        if block_type in [
            "paragraph",
            "heading_1",
            "heading_2",
            "heading_3",
            "bulleted_list_item",
            "numbered_list_item",
            "quote",
            "callout",
            "toggle"
        ]:
            rich_text = block_data.get("rich_text", [])
            text = " ".join([
                t.get("plain_text", "")
                for t in rich_text
            ])
            if text.strip():
                # Add heading marker for context
                if "heading" in block_type:
                    text_parts.append(f"\n## {text}")
                else:
                    text_parts.append(text)

        elif block_type == "to_do":
            rich_text = block_data.get("rich_text", [])
            text = " ".join([
                t.get("plain_text", "")
                for t in rich_text
            ])
            checked = block_data.get("checked", False)
            if text.strip():
                text_parts.append(
                    f"{'[x]' if checked else '[ ]'} {text}"
                )

        elif block_type == "code":
            rich_text = block_data.get("rich_text", [])
            text = " ".join([
                t.get("plain_text", "")
                for t in rich_text
            ])
            if text.strip():
                text_parts.append(f"Code: {text}")

    return "\n".join(text_parts)


# ─────────────────────────────────────────
# GET PAGE TITLE
# ─────────────────────────────────────────

def get_page_title(page: dict) -> str:
    """Extract title from Notion page object"""

    # Try properties first
    properties = page.get("properties", {})

    for prop_name, prop_data in properties.items():
        if prop_data.get("type") == "title":
            title_array = prop_data.get("title", [])
            if title_array:
                return title_array[0].get("plain_text", "Untitled")

    return "Untitled"


# ─────────────────────────────────────────
# FULL NOTION INGESTION
# ─────────────────────────────────────────

async def ingest_notion_workspace(
    org_id: str,
    integration_id: str
) -> dict:
    """
    Main Notion ingestion function.
    Reads all pages and extracts knowledge.
    """

    print(f"Starting Notion ingestion for org {org_id}")

    stats = {
        "pages_found": 0,
        "pages_processed": 0,
        "documents_saved": 0,
        "nodes_extracted": 0
    }

    # Step 1: Get all pages
    pages = await get_all_pages()
    stats["pages_found"] = len(pages)

    if not pages:
        print("No Notion pages found")
        return stats

    doc_ids = []

    for page in pages:
        page_id = page.get("id", "").replace("-", "")
        title = get_page_title(page)

        print(f"Processing page: {title}")

        # Step 2: Get page content
        content = await get_page_content(page_id)

        if not content or len(content) < 50:
            print(f"Skipping {title} — too short")
            continue

        stats["pages_processed"] += 1

        # Step 3: Check for duplicates
        content_hash = hashlib.md5(content.encode()).hexdigest()

        existing = supabase.table("documents")\
            .select("id")\
            .eq("org_id", org_id)\
            .eq("content_hash", content_hash)\
            .execute()

        if existing.data:
            print(f"Skipping {title} — already processed")
            continue

        # Step 4: Save raw document
        doc_result = supabase.table("documents").insert({
            "org_id": org_id,
            "integration_id": integration_id,
            "source_type": "notion",
            "source_id": page_id,
            "source_url": page.get("url", ""),
            "title": title,
            "raw_content": content,
            "content_hash": content_hash,
            "is_processed": False
        }).execute()

        if doc_result.data:
            doc_ids.append(doc_result.data[0]["id"])
            stats["documents_saved"] += 1

        # Step 5: Extract knowledge
        nodes = await extract_knowledge(
            f"Page: {title}\n\n{content}",
            source_type="notion"
        )

        if nodes:
            saved = await save_knowledge_nodes_batch(
                org_id=org_id,
                nodes=nodes,
                source_doc_ids=[doc_result.data[0]["id"]]
                if doc_result.data else []
            )
            stats["nodes_extracted"] += len(saved)
            print(f"Extracted {len(saved)} nodes from {title}")

    # Step 6: Update integration
    supabase.table("integrations")\
        .update({
            "last_synced_at": "now()",
            "total_documents": stats["documents_saved"],
            "status": "active"
        })\
        .eq("id", integration_id)\
        .execute()

    # Step 7: Mark documents as processed
    if doc_ids:
        supabase.table("documents")\
            .update({"is_processed": True})\
            .in_("id", doc_ids)\
            .execute()

    print(f"Notion ingestion complete: {stats}")
    return stats