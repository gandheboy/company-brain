from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user
from app.services.ai_service import (
    extract_knowledge,
    answer_question,
    test_connection
)
from pydantic import BaseModel

router = APIRouter()


class ExtractRequest(BaseModel):
    text: str
    source_type: str = "general"


class QuestionRequest(BaseModel):
    question: str


# ─────────────────────────────────────────
# TEST ENDPOINT — NO AUTH REQUIRED
# ─────────────────────────────────────────

@router.post("/ai/extract-test")
async def extract_test_no_auth(request: ExtractRequest):
    """
    Test extraction WITHOUT auth.
    For development testing only.
    """
    if not request.text.strip():
        raise HTTPException(
            status_code=400,
            detail="Text cannot be empty"
        )

    nodes = await extract_knowledge(
        request.text,
        request.source_type
    )

    return {
        "nodes_extracted": len(nodes),
        "nodes": nodes
    }


# ─────────────────────────────────────────
# PRODUCTION ENDPOINTS — AUTH REQUIRED
# ─────────────────────────────────────────

@router.get("/ai/health")
async def ai_health():
    """Test if Ollama AI is connected"""
    is_connected = await test_connection()

    return {
        "claude_connected": is_connected,
        "status": "ready" if is_connected else "error"
    }


@router.post("/ai/extract")
async def extract_knowledge_route(
    request: ExtractRequest,
    current_user=Depends(get_current_user)
):
    """Extract knowledge from text"""
    if not request.text.strip():
        raise HTTPException(
            status_code=400,
            detail="Text cannot be empty"
        )

    nodes = await extract_knowledge(
        request.text,
        request.source_type
    )

    return {
        "nodes_extracted": len(nodes),
        "nodes": nodes
    }


@router.post("/ai/answer")
async def answer_question_route(
    request: QuestionRequest,
    current_user=Depends(get_current_user)
):
    """Answer a question using knowledge base"""

    sample_nodes = [
        {
            "title": "Refund Policy",
            "type": "policy",
            "content": "Refunds under $500 are processed automatically. Refunds over $500 require manager approval.",
            "exceptions": "Enterprise customers always require manager approval regardless of amount."
        }
    ]

    result = await answer_question(
        request.question,
        sample_nodes
    )

    return result