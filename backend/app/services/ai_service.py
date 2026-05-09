import httpx
import json
from app.core.database import settings

# Ollama settings
OLLAMA_URL = settings.ollama_url
MODEL = settings.ollama_model


# ─────────────────────────────────────────
# CORE: Call Ollama
# ─────────────────────────────────────────

async def call_ollama(prompt: str, max_tokens: int = 2000) -> str:
    """Send prompt to Ollama and get response"""
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "num_predict": max_tokens,
                    "temperature": 0.1
                }
            }
        )
        response.raise_for_status()
        data = response.json()
        return data.get("response", "").strip()


def clean_json_response(text: str) -> str:
    """Clean AI response to get pure JSON"""
    text = text.strip()

    # Remove markdown code blocks
    if "```json" in text:
        text = text.split("```json")[1]
        text = text.split("```")[0]
    elif "```" in text:
        text = text.split("```")[1]
        text = text.split("```")[0]

    # Find JSON array or object
    text = text.strip()

    # Find first [ or {
    start_array = text.find("[")
    start_object = text.find("{")

    if start_array == -1 and start_object == -1:
        return text

    if start_array == -1:
        text = text[start_object:]
    elif start_object == -1:
        text = text[start_array:]
    else:
        text = text[min(start_array, start_object):]

    # Find last ] or }
    if text.startswith("["):
        end = text.rfind("]")
        if end != -1:
            text = text[:end+1]
    else:
        end = text.rfind("}")
        if end != -1:
            text = text[:end+1]

    return text.strip()


# ─────────────────────────────────────────
# KNOWLEDGE EXTRACTION
# ─────────────────────────────────────────

async def extract_knowledge(
    text: str,
    source_type: str = "general"
) -> list[dict]:
    """
    Extract structured knowledge from raw text.
    Core brain function.
    """

    prompt = f"""You are analyzing company content to extract knowledge.
Source: {source_type}

Content:
{text}

Extract knowledge nodes. Return ONLY a JSON array.
No explanation. No text before or after. Just the JSON array.

Each item must have these exact fields:
- title: short clear title
- content: the actual knowledge clearly explained
- type: one of procedure/policy/decision/context
- applies_to: which team or role, or "all"
- conditions: when this applies, or null
- exceptions: known exceptions, or null
- confidence: number between 0.6 and 1.0

Only extract real actionable knowledge.
Skip greetings and small talk.
If nothing to extract return empty array.

JSON array:"""

    try:
        raw = await call_ollama(prompt)
        cleaned = clean_json_response(raw)
        nodes = json.loads(cleaned)

        if not isinstance(nodes, list):
            return []

        # Validate and filter
        valid_nodes = []
        for node in nodes:
            if (
                isinstance(node, dict)
                and node.get("title")
                and node.get("content")
                and node.get("confidence", 0) >= 0.6
            ):
                valid_nodes.append(node)

        return valid_nodes

    except json.JSONDecodeError as e:
        print(f"JSON parse error in extraction: {e}")
        print(f"Raw response: {raw[:500]}")
        return []
    except Exception as e:
        print(f"Extraction error: {e}")
        return []


# ─────────────────────────────────────────
# QUESTION ANSWERING
# ─────────────────────────────────────────

async def answer_question(
    question: str,
    knowledge_nodes: list[dict],
    org_name: str = "your company"
) -> dict:
    """Answer a question using knowledge nodes"""

    if not knowledge_nodes:
        return {
            "answer": "I don't have enough information yet. Connect more integrations to build up the knowledge base.",
            "confidence": 0.0,
            "sources_used": [],
            "has_answer": False,
            "missing_info": "No knowledge nodes available"
        }

    # Format knowledge
    knowledge_text = ""
    for i, node in enumerate(knowledge_nodes):
        knowledge_text += f"\n[{i+1}] {node['title']}\n"
        knowledge_text += f"    {node['content']}\n"
        if node.get("exceptions"):
            knowledge_text += f"    Exceptions: {node['exceptions']}\n"

    prompt = f"""You are Company Brain for {org_name}.
Answer using ONLY the knowledge below.

Knowledge:
{knowledge_text}

Question: {question}

Return ONLY a JSON object. No text before or after:
{{
  "answer": "clear specific answer",
  "confidence": 0.0 to 1.0,
  "has_answer": true or false,
  "missing_info": "what is missing or null"
}}

JSON:"""

    try:
        raw = await call_ollama(prompt, max_tokens=500)
        cleaned = clean_json_response(raw)
        result = json.loads(cleaned)
        result["sources_used"] = [n["title"] for n in knowledge_nodes]
        return result

    except Exception as e:
        print(f"Answer error: {e}")
        return {
            "answer": "Error processing your question. Please try again.",
            "confidence": 0.0,
            "sources_used": [],
            "has_answer": False,
            "missing_info": None
        }


# ─────────────────────────────────────────
# CONFLICT DETECTION
# ─────────────────────────────────────────

async def detect_conflict(
    node_a: dict,
    node_b: dict
) -> dict:
    """Check if two knowledge nodes contradict each other"""

    prompt = f"""Compare these two company knowledge entries.

Entry A: {node_a['title']}
{node_a['content']}

Entry B: {node_b['title']}
{node_b['content']}

Return ONLY a JSON object:
{{
  "has_conflict": true or false,
  "conflict_type": "contradiction or overlap or supersedes or none",
  "explanation": "brief explanation",
  "recommendation": "how to resolve or null"
}}

JSON:"""

    try:
        raw = await call_ollama(prompt, max_tokens=300)
        cleaned = clean_json_response(raw)
        return json.loads(cleaned)

    except Exception as e:
        print(f"Conflict detection error: {e}")
        return {
            "has_conflict": False,
            "conflict_type": "none",
            "explanation": "Could not analyze",
            "recommendation": None
        }


# ─────────────────────────────────────────
# CONNECTION TEST
# ─────────────────────────────────────────

async def test_connection() -> bool:
    """Test if Ollama is running"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{OLLAMA_URL}/api/tags")
            return response.status_code == 200
    except Exception as e:
        print(f"Ollama connection error: {e}")
        return False