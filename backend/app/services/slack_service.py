import httpx
from app.core.database import supabase
from app.services.ai_service import extract_knowledge
from app.services.knowledge_service import save_knowledge_nodes_batch
from typing import Optional
import hashlib


# ─────────────────────────────────────────
# SLACK API HELPER
# ─────────────────────────────────────────

async def slack_api_call(
    endpoint: str,
    token: str,
    params: dict = {}
) -> dict:
    """Make a call to Slack API"""
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            f"https://slack.com/api/{endpoint}",
            headers={"Authorization": f"Bearer {token}"},
            params=params
        )
        return response.json()


# ─────────────────────────────────────────
# GET ALL CHANNELS
# ─────────────────────────────────────────

async def get_channels(token: str) -> list[dict]:
    """Get all public channels in workspace"""
    data = await slack_api_call(
        "conversations.list",
        token,
        {
            "types": "public_channel",
            "limit": 100,
            "exclude_archived": True
        }
    )

    if not data.get("ok"):
        print(f"Slack channels error: {data.get('error')}")
        return []

    channels = data.get("channels", [])

    # Filter out very large channels (noise)
    # Focus on channels with real discussions
    filtered = [
        c for c in channels
        if c.get("num_members", 0) > 0
        and not c["name"].startswith("ext-")
    ]

    return filtered


# ─────────────────────────────────────────
# GET MESSAGES FROM CHANNEL
# ─────────────────────────────────────────

async def get_channel_messages(
    token: str,
    channel_id: str,
    limit: int = 200
) -> list[dict]:
    """Get recent messages from a channel"""
    data = await slack_api_call(
        "conversations.history",
        token,
        {
            "channel": channel_id,
            "limit": limit
        }
    )

    if not data.get("ok"):
        error = data.get("error", "unknown")
        if error != "not_in_channel":
            print(f"Channel {channel_id} error: {error}")
        return []

    messages = data.get("messages", [])

    # Filter noise
    filtered = []
    for msg in messages:
        # Skip bot messages
        if msg.get("subtype"):
            continue
        # Skip very short messages
        text = msg.get("text", "")
        if len(text) < 30:
            continue
        # Skip messages that are just links
        if text.startswith("http") and " " not in text:
            continue

        filtered.append(msg)

    return filtered


# ─────────────────────────────────────────
# GET THREAD REPLIES
# ─────────────────────────────────────────

async def get_thread_replies(
    token: str,
    channel_id: str,
    thread_ts: str
) -> list[dict]:
    """Get replies in a thread"""
    data = await slack_api_call(
        "conversations.replies",
        token,
        {
            "channel": channel_id,
            "ts": thread_ts,
            "limit": 50
        }
    )

    if not data.get("ok"):
        return []

    # Skip first message (it's the parent)
    return data.get("messages", [])[1:]


# ─────────────────────────────────────────
# FILTER HIGH SIGNAL MESSAGES
# ─────────────────────────────────────────

def is_high_signal(text: str) -> bool:
    """
    Check if message likely contains
    company knowledge worth extracting.
    """
    text_lower = text.lower()

    # High signal keywords
    keywords = [
        "always", "never", "must", "should",
        "process", "procedure", "policy", "rule",
        "how to", "how we", "we use", "we do",
        "make sure", "important", "required",
        "approval", "approve", "escalate",
        "deadline", "sla", "template",
        "reminder", "fyi", "heads up",
        "going forward", "from now on",
        "decision", "decided", "agreed",
        "standard", "guideline", "protocol"
    ]

    return any(kw in text_lower for kw in keywords)


# ─────────────────────────────────────────
# FULL SLACK INGESTION
# ─────────────────────────────────────────

async def ingest_slack_workspace(
    org_id: str,
    integration_id: str,
    token: str
) -> dict:
    """
    Main ingestion function.
    Pulls all Slack messages and extracts knowledge.

    Returns summary of what was processed.
    """

    print(f"Starting Slack ingestion for org {org_id}")

    stats = {
        "channels_processed": 0,
        "messages_found": 0,
        "high_signal_messages": 0,
        "documents_saved": 0,
        "nodes_extracted": 0
    }

    # Step 1: Get all channels
    channels = await get_channels(token)
    print(f"Found {len(channels)} channels")

    all_high_signal_texts = []
    doc_ids = []

    for channel in channels:
        channel_id = channel["id"]
        channel_name = channel["name"]

        # Step 2: Get messages
        messages = await get_channel_messages(token, channel_id)

        if not messages:
            continue

        stats["channels_processed"] += 1
        stats["messages_found"] += len(messages)

        # Step 3: Filter high signal messages
        high_signal = []
        for msg in messages:
            text = msg.get("text", "")
            if is_high_signal(text):
                high_signal.append({
                    "text": text,
                    "channel": channel_name,
                    "ts": msg.get("ts")
                })

                # Get thread replies for high signal messages
                if msg.get("reply_count", 0) > 0:
                    replies = await get_thread_replies(
                        token,
                        channel_id,
                        msg["ts"]
                    )
                    for reply in replies:
                        reply_text = reply.get("text", "")
                        if len(reply_text) > 30:
                            high_signal.append({
                                "text": reply_text,
                                "channel": f"{channel_name} (thread)",
                                "ts": reply.get("ts")
                            })

        stats["high_signal_messages"] += len(high_signal)

        # Step 4: Save raw documents
        for item in high_signal:
            content_hash = hashlib.md5(
                item["text"].encode()
            ).hexdigest()

            # Check if already saved
            existing = supabase.table("documents")\
                .select("id")\
                .eq("org_id", org_id)\
                .eq("content_hash", content_hash)\
                .execute()

            if existing.data:
                continue

            # Save document
            doc_result = supabase.table("documents").insert({
                "org_id": org_id,
                "integration_id": integration_id,
                "source_type": "slack",
                "source_id": item["ts"],
                "title": f"#{item['channel']}",
                "raw_content": item["text"],
                "content_hash": content_hash,
                "is_processed": False
            }).execute()

            if doc_result.data:
                doc_ids.append(doc_result.data[0]["id"])
                stats["documents_saved"] += 1

        # Combine channel messages for extraction
        if high_signal:
            combined_text = "\n\n".join([
                f"[#{item['channel']}]: {item['text']}"
                for item in high_signal[:20]  # Max 20 per channel
            ])
            all_high_signal_texts.append({
                "text": combined_text,
                "channel": channel_name
            })

    # Step 5: Extract knowledge from all high signal content
    print(f"Extracting knowledge from {len(all_high_signal_texts)} channel batches")

    for batch in all_high_signal_texts:
        nodes = await extract_knowledge(
            batch["text"],
            source_type="slack"
        )

        if nodes:
            saved = await save_knowledge_nodes_batch(
                org_id=org_id,
                nodes=nodes,
                source_doc_ids=doc_ids
            )
            stats["nodes_extracted"] += len(saved)

    # Step 6: Update integration status
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

    print(f"Ingestion complete: {stats}")
    return stats