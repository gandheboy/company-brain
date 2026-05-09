from sentence_transformers import SentenceTransformer
import numpy as np
from typing import Union
import asyncio

# Load model once at startup
# all-MiniLM-L6-v2 is:
# - Small (80MB)
# - Fast
# - 384 dimensions
# - Perfect for semantic search
print("Loading embedding model...")
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
print("Embedding model loaded ✅")


def generate_embedding(text: str) -> list[float]:
    """
    Convert text to embedding vector.
    
    Input:  "How do we handle refunds?"
    Output: [0.23, 0.87, 0.12, ...] (384 numbers)
    """
    if not text or not text.strip():
        return []

    # Clean text
    text = text.strip()[:512]  # Limit length

    # Generate embedding
    embedding = embedding_model.encode(
        text,
        normalize_embeddings=True  # Normalize for cosine similarity
    )

    return embedding.tolist()


def generate_embeddings_batch(texts: list[str]) -> list[list[float]]:
    """
    Generate embeddings for multiple texts at once.
    Much faster than one by one.
    """
    if not texts:
        return []

    # Clean texts
    cleaned = [t.strip()[:512] for t in texts if t and t.strip()]

    if not cleaned:
        return []

    embeddings = embedding_model.encode(
        cleaned,
        normalize_embeddings=True,
        batch_size=32,
        show_progress_bar=False
    )

    return [e.tolist() for e in embeddings]


def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """
    Calculate similarity between two embeddings.
    Returns: 0.0 (completely different) to 1.0 (identical)
    """
    a = np.array(vec_a)
    b = np.array(vec_b)

    if np.linalg.norm(a) == 0 or np.linalg.norm(b) == 0:
        return 0.0

    return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


def find_similar(
    query_embedding: list[float],
    candidate_embeddings: list[dict],
    top_k: int = 5,
    min_similarity: float = 0.3
) -> list[dict]:
    """
    Find most similar items from a list.
    
    candidate_embeddings: list of dicts with 'embedding' and 'id' fields
    Returns: top_k most similar items with similarity scores
    """
    if not query_embedding or not candidate_embeddings:
        return []

    results = []

    for candidate in candidate_embeddings:
        if not candidate.get("embedding"):
            continue

        similarity = cosine_similarity(
            query_embedding,
            candidate["embedding"]
        )

        if similarity >= min_similarity:
            results.append({
                **candidate,
                "similarity": round(similarity, 4)
            })

    # Sort by similarity descending
    results.sort(key=lambda x: x["similarity"], reverse=True)

    return results[:top_k]