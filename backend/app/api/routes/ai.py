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

class EmbedRequest(BaseModel):
    text: str


@router.post("/ai/embed-test")
async def embed_test(request: EmbedRequest):
    """
    Test embedding generation.
    No auth required for testing.
    """
    from app.services.embedding_service import generate_embedding

    if not request.text.strip():
        raise HTTPException(
            status_code=400,
            detail="Text cannot be empty"
        )

    embedding = generate_embedding(request.text)

    return {
        "text": request.text,
        "embedding_dimensions": len(embedding),
        "first_5_values": embedding[:5],
        "status": "success" if embedding else "failed"
    }


@router.post("/ai/similarity-test")
async def similarity_test():
    """
    Test similarity between two texts.
    Shows how semantic search works.
    """
    from app.services.embedding_service import (
        generate_embedding,
        cosine_similarity
    )

    # These should be very similar
    text_a = "How do we handle customer refunds?"
    text_b = "What is the refund approval process?"

    # These should be very different
    text_c = "How do we deploy to production?"

    emb_a = generate_embedding(text_a)
    emb_b = generate_embedding(text_b)
    emb_c = generate_embedding(text_c)

    sim_ab = cosine_similarity(emb_a, emb_b)
    sim_ac = cosine_similarity(emb_a, emb_c)

    return {
        "test_1": {
            "text_a": text_a,
            "text_b": text_b,
            "similarity": round(sim_ab, 4),
            "verdict": "✅ Similar" if sim_ab > 0.5 else "❌ Not similar enough"
        },
        "test_2": {
            "text_a": text_a,
            "text_c": text_c,
            "similarity": round(sim_ac, 4),
            "verdict": "✅ Different" if sim_ac < 0.5 else "❌ Too similar"
        },
        "explanation": "Higher = more similar. >0.8 = very similar. <0.5 = different topic."
    }