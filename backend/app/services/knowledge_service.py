from app.core.database import supabase
from app.services.embedding_service import (
    generate_embedding,
    generate_embeddings_batch
)
from app.services.ai_service import detect_conflict
from typing import Optional
import uuid


# ─────────────────────────────────────────
# SAVE KNOWLEDGE NODE
# ─────────────────────────────────────────

async def save_knowledge_node(
    org_id: str,
    title: str,
    content: str,
    node_type: str,
    applies_to: str = "all",
    conditions: Optional[str] = None,
    exceptions: Optional[str] = None,
    confidence_score: float = 0.8,
    source_doc_ids: list = []
) -> dict:
    """
    Save a single knowledge node to database
    with its embedding vector.
    """

    # Generate embedding for this node
    # Combine title + content for better search
    embed_text = f"{title}. {content}"
    embedding = generate_embedding(embed_text)

    # Save to database
    result = supabase.table("knowledge_nodes").insert({
        "org_id": org_id,
        "title": title,
        "content": content,
        "type": node_type,
        "applies_to": applies_to,
        "conditions": conditions,
        "exceptions": exceptions,
        "confidence_score": confidence_score,
        "source_doc_ids": source_doc_ids,
        "embedding": embedding,
        "is_verified": False,
        "is_outdated": False
    }).execute()

    if not result.data:
        raise Exception("Failed to save knowledge node")

    return result.data[0]


# ─────────────────────────────────────────
# SAVE MULTIPLE NODES AT ONCE
# ─────────────────────────────────────────

async def save_knowledge_nodes_batch(
    org_id: str,
    nodes: list[dict],
    source_doc_ids: list = []
) -> list[dict]:
    """
    Save multiple knowledge nodes efficiently.
    Generates all embeddings in one batch call.
    """

    if not nodes:
        return []

    # Generate all embeddings at once
    texts = [f"{n['title']}. {n['content']}" for n in nodes]
    embeddings = generate_embeddings_batch(texts)

    # Prepare records for database
    records = []
    for i, node in enumerate(nodes):
        records.append({
            "org_id": org_id,
            "title": node.get("title", ""),
            "content": node.get("content", ""),
            "type": node.get("type", "context"),
            "applies_to": node.get("applies_to", "all"),
            "conditions": node.get("conditions"),
            "exceptions": node.get("exceptions"),
            "confidence_score": node.get("confidence", 0.8),
            "source_doc_ids": source_doc_ids,
            "embedding": embeddings[i] if i < len(embeddings) else [],
            "is_verified": False,
            "is_outdated": False
        })

    # Batch insert
    result = supabase.table("knowledge_nodes")\
        .insert(records)\
        .execute()

    if not result.data:
        raise Exception("Failed to save knowledge nodes")

    return result.data


# ─────────────────────────────────────────
# GET ALL NODES FOR AN ORG
# ─────────────────────────────────────────

def get_knowledge_nodes(
    org_id: str,
    node_type: Optional[str] = None,
    limit: int = 50
) -> list[dict]:
    """
    Get knowledge nodes for an organization.
    Optionally filter by type.
    """

    query = supabase.table("knowledge_nodes")\
        .select("id, title, content, type, applies_to, conditions, exceptions, confidence_score, is_verified, is_outdated, created_at")\
        .eq("org_id", org_id)\
        .eq("is_outdated", False)\
        .order("confidence_score", desc=True)\
        .limit(limit)

    if node_type:
        query = query.eq("type", node_type)

    result = query.execute()
    return result.data or []


# ─────────────────────────────────────────
# VECTOR SEARCH
# ─────────────────────────────────────────

def search_knowledge(
    org_id: str,
    query: str,
    limit: int = 5
) -> list[dict]:
    """
    Search knowledge nodes using vector similarity.
    This is the semantic search engine.
    
    Input:  "How do we handle refunds?"
    Output: Most relevant knowledge nodes
    """

    # Generate embedding for the query
    query_embedding = generate_embedding(query)

    if not query_embedding:
        return []

    try:
        # Use Supabase's built-in vector search
        result = supabase.rpc(
            "search_knowledge_nodes",
            {
                "query_embedding": query_embedding,
                "match_org_id": org_id,
                "match_count": limit
            }
        ).execute()

        return result.data or []

    except Exception as e:
        print(f"Vector search error: {e}")
        # Fallback to regular search if vector search fails
        return get_knowledge_nodes(org_id, limit=limit)


# ─────────────────────────────────────────
# DELETE NODE
# ─────────────────────────────────────────

def delete_knowledge_node(node_id: str, org_id: str) -> bool:
    """Delete a knowledge node"""
    result = supabase.table("knowledge_nodes")\
        .delete()\
        .eq("id", node_id)\
        .eq("org_id", org_id)\
        .execute()

    return True


# ─────────────────────────────────────────
# MARK AS OUTDATED
# ─────────────────────────────────────────

def mark_node_outdated(
    node_id: str,
    org_id: str,
    reason: str = "Manually marked as outdated"
) -> dict:
    """Mark a knowledge node as outdated"""
    result = supabase.table("knowledge_nodes")\
        .update({
            "is_outdated": True,
            "outdated_reason": reason
        })\
        .eq("id", node_id)\
        .eq("org_id", org_id)\
        .execute()

    return result.data[0] if result.data else {}


# ─────────────────────────────────────────
# VERIFY NODE
# ─────────────────────────────────────────

def verify_knowledge_node(node_id: str, org_id: str) -> dict:
    """Mark a knowledge node as human-verified"""
    result = supabase.table("knowledge_nodes")\
        .update({"is_verified": True})\
        .eq("id", node_id)\
        .eq("org_id", org_id)\
        .execute()

    return result.data[0] if result.data else {}