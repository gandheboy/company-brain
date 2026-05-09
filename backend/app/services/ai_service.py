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

        # Strategy 1: Direct parse
        try:
            nodes = json.loads(cleaned)
            if isinstance(nodes, list):
                valid_nodes = [
                    n for n in nodes
                    if isinstance(n, dict)
                    and n.get("title")
                    and n.get("content")
                    and n.get("confidence", 0) >= 0.6
                ]
                return valid_nodes
        except Exception:
            pass

        # Strategy 2: Find JSON array
        import re
        array_match = re.search(r'\[.*?\]', raw, re.DOTALL)
        if array_match:
            try:
                nodes = json.loads(array_match.group())
                if isinstance(nodes, list):
                    return [
                        n for n in nodes
                        if isinstance(n, dict)
                        and n.get("title")
                        and n.get("content")
                    ]
            except Exception:
                pass

        # Strategy 3: Return empty if all parsing fails
        print(f"Could not parse extraction response: {raw[:200]}")
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

Do these contradict each other?

Reply with ONLY this JSON, nothing else:
{{"has_conflict": true, "conflict_type": "contradiction", "explanation": "reason here", "recommendation": "fix here"}}

Or if no conflict:
{{"has_conflict": false, "conflict_type": "none", "explanation": "they are consistent", "recommendation": null}}"""

    try:
        raw = await call_ollama(prompt, max_tokens=200)

        # Try multiple parsing strategies
        cleaned = clean_json_response(raw)

        # Strategy 1: Direct parse
        try:
            return json.loads(cleaned)
        except Exception:
            pass

        # Strategy 2: Find JSON in response
        import re
        json_match = re.search(r'\{[^{}]+\}', raw, re.DOTALL)
        if json_match:
            try:
                return json.loads(json_match.group())
            except Exception:
                pass

        # Strategy 3: Parse keywords from response
        raw_lower = raw.lower()
        has_conflict = any(word in raw_lower for word in [
            "contradict", "conflict", "inconsistent",
            "different", "opposite", "disagree"
        ])

        return {
            "has_conflict": has_conflict,
            "conflict_type": "contradiction" if has_conflict else "none",
            "explanation": raw[:200] if raw else "Could not analyze",
            "recommendation": "Review both entries manually" if has_conflict else None
        }

    except Exception as e:
        print(f"Conflict detection error: {e}")
        return {
            "has_conflict": False,
            "conflict_type": "none",
            "explanation": "Analysis failed",
            "recommendation": None
        }


def _parse_json_object(text: str) -> dict | None:
    """Parse the first JSON object from model output safely."""
    cleaned = clean_json_response(text)

    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass

    start = cleaned.find("{")
    if start == -1:
        return None

    try:
        decoder = json.JSONDecoder()
        parsed, _ = decoder.raw_decode(cleaned[start:])
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        return None

    return None


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