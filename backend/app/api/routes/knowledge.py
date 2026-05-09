from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user, get_current_org
from app.services.knowledge_service import (
    save_knowledge_node,
    save_knowledge_nodes_batch,
    get_knowledge_nodes,
    search_knowledge,
    delete_knowledge_node,
    mark_node_outdated,
    verify_knowledge_node
)
from app.services.ai_service import extract_knowledge
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class SaveNodeRequest(BaseModel):
    title: str
    content: str
    type: str
    applies_to: str = "all"
    conditions: Optional[str] = None
    exceptions: Optional[str] = None
    confidence_score: float = 0.8


class ExtractAndSaveRequest(BaseModel):
    text: str
    source_type: str = "general"


class SearchRequest(BaseModel):
    query: str
    limit: int = 5


# ─────────────────────────────────────────
# SAVE A SINGLE NODE
# ─────────────────────────────────────────

@router.post("/knowledge/nodes")
async def create_knowledge_node(
    request: SaveNodeRequest,
    current_org=Depends(get_current_org)
):
    """Save a single knowledge node"""
    node = await save_knowledge_node(
        org_id=current_org["id"],
        title=request.title,
        content=request.content,
        node_type=request.type,
        applies_to=request.applies_to,
        conditions=request.conditions,
        exceptions=request.exceptions,
        confidence_score=request.confidence_score
    )
    return node


# ─────────────────────────────────────────
# EXTRACT FROM TEXT AND SAVE
# ─────────────────────────────────────────

@router.post("/knowledge/extract-and-save")
async def extract_and_save(
    request: ExtractAndSaveRequest,
    current_org=Depends(get_current_org)
):
    """
    Extract knowledge from text AND save to database.
    This is the core pipeline endpoint.
    """

    # Step 1: Extract nodes using AI
    nodes = await extract_knowledge(
        request.text,
        request.source_type
    )

    if not nodes:
        return {
            "message": "No knowledge found in this text",
            "nodes_saved": 0,
            "nodes": []
        }

    # Step 2: Save nodes with embeddings
    saved = await save_knowledge_nodes_batch(
        org_id=current_org["id"],
        nodes=nodes
    )

    return {
        "message": f"Successfully extracted and saved {len(saved)} knowledge nodes",
        "nodes_saved": len(saved),
        "nodes": saved
    }


# ─────────────────────────────────────────
# GET ALL NODES
# ─────────────────────────────────────────

@router.get("/knowledge/nodes")
async def list_knowledge_nodes(
    node_type: Optional[str] = None,
    limit: int = 50,
    current_org=Depends(get_current_org)
):
    """Get all knowledge nodes for this organization"""
    nodes = get_knowledge_nodes(
        org_id=current_org["id"],
        node_type=node_type,
        limit=limit
    )
    return {
        "total": len(nodes),
        "nodes": nodes
    }


# ─────────────────────────────────────────
# SEARCH
# ─────────────────────────────────────────

@router.post("/knowledge/search")
async def search_knowledge_nodes(
    request: SearchRequest,
    current_org=Depends(get_current_org)
):
    """
    Search knowledge using semantic vector search.
    This powers the query interface.
    """
    results = search_knowledge(
        org_id=current_org["id"],
        query=request.query,
        limit=request.limit
    )

    return {
        "query": request.query,
        "results_found": len(results),
        "results": results
    }


# ─────────────────────────────────────────
# VERIFY NODE
# ─────────────────────────────────────────

@router.patch("/knowledge/nodes/{node_id}/verify")
async def verify_node(
    node_id: str,
    current_org=Depends(get_current_org)
):
    """Mark a node as human-verified"""
    node = verify_knowledge_node(node_id, current_org["id"])
    return node


# ─────────────────────────────────────────
# MARK OUTDATED
# ─────────────────────────────────────────

@router.patch("/knowledge/nodes/{node_id}/outdated")
async def mark_outdated(
    node_id: str,
    current_org=Depends(get_current_org)
):
    """Mark a node as outdated"""
    node = mark_node_outdated(node_id, current_org["id"])
    return node


# ─────────────────────────────────────────
# DELETE NODE
# ─────────────────────────────────────────

@router.delete("/knowledge/nodes/{node_id}")
async def delete_node(
    node_id: str,
    current_org=Depends(get_current_org)
):
    """Delete a knowledge node"""
    delete_knowledge_node(node_id, current_org["id"])
    return {"message": "Node deleted successfully"}


# ─────────────────────────────────────────
# TEST ENDPOINT — NO AUTH
# ─────────────────────────────────────────

@router.post("/knowledge/extract-save-test")
async def extract_save_test(request: ExtractAndSaveRequest):
    """
    Test extract and save WITHOUT auth.
    Development only.
    """
    from app.core.database import supabase

    # Get first org for testing
    orgs = supabase.table("organizations")\
        .select("id")\
        .limit(1)\
        .execute()

    if not orgs.data:
        raise HTTPException(
            status_code=400,
            detail="No organizations found. Please sign up first."
        )

    org_id = orgs.data[0]["id"]

    # Extract
    nodes = await extract_knowledge(
        request.text,
        request.source_type
    )

    if not nodes:
        return {
            "message": "No knowledge found",
            "nodes_saved": 0,
            "nodes": []
        }

    # Save
    saved = await save_knowledge_nodes_batch(
        org_id=org_id,
        nodes=nodes
    )

    return {
        "message": f"Extracted and saved {len(saved)} nodes",
        "nodes_saved": len(saved),
        "nodes": saved
    }