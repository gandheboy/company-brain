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


class QueryRequest(BaseModel):
    question: str


class ResolveConflictRequest(BaseModel):
    keep_node_id: str
    discard_node_id: str


# ─────────────────────────────────────────
# NO AUTH TEST ENDPOINTS
# ─────────────────────────────────────────

@router.post("/knowledge/extract-save-test")
async def extract_save_test(request: ExtractAndSaveRequest):
    """Test extraction without auth. Dev only."""
    from app.core.database import supabase

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

    saved = await save_knowledge_nodes_batch(
        org_id=org_id,
        nodes=nodes
    )

    return {
        "message": f"Extracted and saved {len(saved)} nodes",
        "nodes_saved": len(saved),
        "nodes": saved
    }


@router.post("/knowledge/query-test")
async def query_test(request: QueryRequest):
    """Full query pipeline without auth. Dev only."""
    from app.core.database import supabase
    from app.services.ai_service import answer_question

    if not request.question.strip():
        raise HTTPException(
            status_code=400,
            detail="Question cannot be empty"
        )

    orgs = supabase.table("organizations")\
        .select("id, name")\
        .limit(1)\
        .execute()

    if not orgs.data:
        raise HTTPException(
            status_code=400,
            detail="No organizations found."
        )

    org_id = orgs.data[0]["id"]
    org_name = orgs.data[0]["name"]

    results = search_knowledge(
        org_id=org_id,
        query=request.question,
        limit=5
    )

    answer = await answer_question(
        question=request.question,
        knowledge_nodes=results,
        org_name=org_name
    )

    return {
        "question": request.question,
        "answer": answer.get("answer"),
        "confidence": answer.get("confidence"),
        "has_answer": answer.get("has_answer"),
        "sources": answer.get("sources_used", []),
        "nodes_searched": len(results),
        "missing_info": answer.get("missing_info")
    }


@router.get("/knowledge/conflicts-test")
async def get_conflicts_test():
    """Find conflicts without auth. Dev only."""
    from app.core.database import supabase
    from app.services.knowledge_service import find_conflicts_for_org

    orgs = supabase.table("organizations")\
        .select("id")\
        .limit(1)\
        .execute()

    if not orgs.data:
        raise HTTPException(
            status_code=400,
            detail="No organizations found."
        )

    conflicts = await find_conflicts_for_org(
        orgs.data[0]["id"]
    )

    return {
        "total_conflicts": len(conflicts),
        "conflicts": conflicts
    }


@router.post("/knowledge/conflicts/resolve-test")
async def resolve_conflict_test(request: ResolveConflictRequest):
    """Resolve conflict without auth. Dev only."""
    from app.core.database import supabase
    from app.services.knowledge_service import resolve_conflict

    orgs = supabase.table("organizations")\
        .select("id")\
        .limit(1)\
        .execute()

    if not orgs.data:
        raise HTTPException(
            status_code=400,
            detail="No org found"
        )

    result = await resolve_conflict(
        org_id=orgs.data[0]["id"],
        keep_node_id=request.keep_node_id,
        discard_node_id=request.discard_node_id
    )

    return result


# ─────────────────────────────────────────
# AUTH REQUIRED ENDPOINTS
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


@router.post("/knowledge/extract-and-save")
async def extract_and_save(
    request: ExtractAndSaveRequest,
    current_org=Depends(get_current_org)
):
    """Extract and save knowledge nodes"""
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

    saved = await save_knowledge_nodes_batch(
        org_id=current_org["id"],
        nodes=nodes
    )

    return {
        "message": f"Saved {len(saved)} nodes",
        "nodes_saved": len(saved),
        "nodes": saved
    }


@router.get("/knowledge/nodes")
async def list_knowledge_nodes(
    node_type: Optional[str] = None,
    limit: int = 50,
    current_org=Depends(get_current_org)
):
    """Get all knowledge nodes"""
    nodes = get_knowledge_nodes(
        org_id=current_org["id"],
        node_type=node_type,
        limit=limit
    )
    return {
        "total": len(nodes),
        "nodes": nodes
    }


@router.post("/knowledge/search")
async def search_knowledge_nodes(
    request: SearchRequest,
    current_org=Depends(get_current_org)
):
    """Semantic search"""
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


@router.post("/knowledge/query")
async def query_knowledge(
    request: QueryRequest,
    current_org=Depends(get_current_org)
):
    """Full query pipeline with auth"""
    from app.services.ai_service import answer_question

    results = search_knowledge(
        org_id=current_org["id"],
        query=request.question,
        limit=5
    )

    answer = await answer_question(
        question=request.question,
        knowledge_nodes=results,
        org_name=current_org["name"]
    )

    return {
        "question": request.question,
        "answer": answer.get("answer"),
        "confidence": answer.get("confidence"),
        "has_answer": answer.get("has_answer"),
        "sources": answer.get("sources_used", []),
        "nodes_searched": len(results),
        "missing_info": answer.get("missing_info")
    }


@router.patch("/knowledge/nodes/{node_id}/verify")
async def verify_node(
    node_id: str,
    current_org=Depends(get_current_org)
):
    """Mark node as verified"""
    node = verify_knowledge_node(node_id, current_org["id"])
    return node


@router.patch("/knowledge/nodes/{node_id}/outdated")
async def mark_outdated(
    node_id: str,
    current_org=Depends(get_current_org)
):
    """Mark node as outdated"""
    node = mark_node_outdated(node_id, current_org["id"])
    return node


@router.delete("/knowledge/nodes/{node_id}")
async def delete_node(
    node_id: str,
    current_org=Depends(get_current_org)
):
    """Delete a knowledge node"""
    delete_knowledge_node(node_id, current_org["id"])
    return {"message": "Node deleted"}


@router.get("/knowledge/conflicts")
async def get_conflicts(
    current_org=Depends(get_current_org)
):
    """Find all conflicts with auth"""
    from app.services.knowledge_service import find_conflicts_for_org

    conflicts = await find_conflicts_for_org(
        current_org["id"]
    )

    return {
        "total_conflicts": len(conflicts),
        "conflicts": conflicts
    }


@router.post("/knowledge/conflicts/resolve")
async def resolve_conflict_route(
    request: ResolveConflictRequest,
    current_org=Depends(get_current_org)
):
    """Resolve a conflict with auth"""
    from app.services.knowledge_service import resolve_conflict

    result = await resolve_conflict(
        org_id=current_org["id"],
        keep_node_id=request.keep_node_id,
        discard_node_id=request.discard_node_id
    )

    return result

@router.get("/knowledge/nodes-test")
async def list_nodes_test():
    """Get all nodes without auth. Dev only."""
    from app.core.database import supabase

    orgs = supabase.table("organizations")\
        .select("id")\
        .limit(1)\
        .execute()

    if not orgs.data:
        raise HTTPException(
            status_code=400,
            detail="No organizations found."
        )

    nodes = get_knowledge_nodes(
        org_id=orgs.data[0]["id"],
        limit=100
    )

    return {
        "total": len(nodes),
        "nodes": nodes
    }


@router.patch("/knowledge/nodes/{node_id}/verify-test")
async def verify_node_test(node_id: str):
    """Verify node without auth. Dev only."""
    from app.core.database import supabase

    orgs = supabase.table("organizations")\
        .select("id")\
        .limit(1)\
        .execute()

    if not orgs.data:
        raise HTTPException(status_code=400, detail="No org")

    node = verify_knowledge_node(
        node_id,
        orgs.data[0]["id"]
    )
    return node


@router.delete("/knowledge/nodes/{node_id}/delete-test")
async def delete_node_test(node_id: str):
    """Delete node without auth. Dev only."""
    from app.core.database import supabase

    orgs = supabase.table("organizations")\
        .select("id")\
        .limit(1)\
        .execute()

    if not orgs.data:
        raise HTTPException(status_code=400, detail="No org")

    delete_knowledge_node(node_id, orgs.data[0]["id"])
    return {"message": "Deleted"}

class FeedbackRequest(BaseModel):
    question: str
    answer: str
    was_helpful: bool
    feedback_text: Optional[str] = None
    node_ids_used: list[str] = []


@router.post("/knowledge/feedback-test")
async def submit_feedback_test(request: FeedbackRequest):
    """Submit answer feedback without auth. Dev only."""
    from app.core.database import supabase

    orgs = supabase.table("organizations")\
        .select("id")\
        .limit(1)\
        .execute()

    if not orgs.data:
        raise HTTPException(
            status_code=400,
            detail="No org found"
        )

    org_id = orgs.data[0]["id"]

    # Save feedback
    supabase.table("query_feedback").insert({
        "org_id": org_id,
        "question": request.question,
        "answer": request.answer,
        "was_helpful": request.was_helpful,
        "feedback_text": request.feedback_text,
        "node_ids_used": request.node_ids_used
    }).execute()

    # If helpful — boost confidence of used nodes
    if request.was_helpful and request.node_ids_used:
        for node_id in request.node_ids_used:
            try:
                # Get current score
                node = supabase.table("knowledge_nodes")\
                    .select("confidence_score")\
                    .eq("id", node_id)\
                    .single()\
                    .execute()

                if node.data:
                    current = node.data["confidence_score"]
                    # Boost by 2% max 0.99
                    new_score = min(0.99, current + 0.02)
                    supabase.table("knowledge_nodes")\
                        .update({"confidence_score": new_score})\
                        .eq("id", node_id)\
                        .execute()
            except Exception as e:
                print(f"Score update error: {e}")

    # If not helpful — reduce confidence
    if not request.was_helpful and request.node_ids_used:
        for node_id in request.node_ids_used:
            try:
                node = supabase.table("knowledge_nodes")\
                    .select("confidence_score")\
                    .eq("id", node_id)\
                    .single()\
                    .execute()

                if node.data:
                    current = node.data["confidence_score"]
                    # Reduce by 3% min 0.3
                    new_score = max(0.3, current - 0.03)
                    supabase.table("knowledge_nodes")\
                        .update({"confidence_score": new_score})\
                        .eq("id", node_id)\
                        .execute()
            except Exception as e:
                print(f"Score update error: {e}")

    return {
        "message": "Feedback recorded",
        "was_helpful": request.was_helpful,
        "nodes_updated": len(request.node_ids_used)
    }


@router.post("/knowledge/feedback")
async def submit_feedback(
    request: FeedbackRequest,
    current_org=Depends(get_current_org)
):
    """Submit answer feedback with auth."""
    from app.core.database import supabase

    org_id = current_org["id"]

    supabase.table("query_feedback").insert({
        "org_id": org_id,
        "question": request.question,
        "answer": request.answer,
        "was_helpful": request.was_helpful,
        "feedback_text": request.feedback_text,
        "node_ids_used": request.node_ids_used
    }).execute()

    if request.was_helpful and request.node_ids_used:
        for node_id in request.node_ids_used:
            try:
                node = supabase.table("knowledge_nodes")\
                    .select("confidence_score")\
                    .eq("id", node_id)\
                    .eq("org_id", org_id)\
                    .single()\
                    .execute()

                if node.data:
                    new_score = min(
                        0.99,
                        node.data["confidence_score"] + 0.02
                    )
                    supabase.table("knowledge_nodes")\
                        .update({"confidence_score": new_score})\
                        .eq("id", node_id)\
                        .execute()
            except Exception:
                pass

    if not request.was_helpful and request.node_ids_used:
        for node_id in request.node_ids_used:
            try:
                node = supabase.table("knowledge_nodes")\
                    .select("confidence_score")\
                    .eq("id", node_id)\
                    .eq("org_id", org_id)\
                    .single()\
                    .execute()

                if node.data:
                    new_score = max(
                        0.3,
                        node.data["confidence_score"] - 0.03
                    )
                    supabase.table("knowledge_nodes")\
                        .update({"confidence_score": new_score})\
                        .eq("id", node_id)\
                        .execute()
            except Exception:
                pass

    return {
        "message": "Feedback recorded",
        "was_helpful": request.was_helpful
    }