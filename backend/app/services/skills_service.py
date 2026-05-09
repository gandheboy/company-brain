from app.core.database import supabase
from app.services.ai_service import call_ollama, clean_json_response
from app.services.knowledge_service import get_knowledge_nodes
import json
from datetime import datetime


# ─────────────────────────────────────────
# GENERATE SKILLS FILE
# ─────────────────────────────────────────

async def generate_skills_file(
    org_id: str,
    org_name: str
) -> dict:
    """
    Generate a skills file from all knowledge nodes.
    This is the core differentiator feature.
    """

    # Get all knowledge nodes
    nodes = get_knowledge_nodes(org_id, limit=50)

    if not nodes:
        return {
            "company": org_name,
            "version": "1.0.0",
            "generated_at": datetime.now().isoformat(),
            "total_skills": 0,
            "skills": [],
            "message": "No knowledge nodes found. Connect integrations first."
        }

    # Group nodes by topic using AI
    nodes_text = ""
    for i, node in enumerate(nodes):
        nodes_text += f"""
Node {i+1}:
Title: {node['title']}
Type: {node['type']}
Content: {node['content']}
"""
        if node.get('exceptions'):
            nodes_text += f"Exceptions: {node['exceptions']}\n"

    prompt = f"""You are creating a Skills File for {org_name}.

A Skills File tells AI agents exactly how to do tasks at this company.

Here are the company's knowledge nodes:
{nodes_text}

Create a skills file JSON. Return ONLY the JSON, nothing else.

Format:
{{
  "company": "{org_name}",
  "version": "1.0.0",
  "skills": [
    {{
      "id": "skill-1",
      "name": "short action name",
      "description": "what this skill handles",
      "trigger_conditions": ["when to use this skill"],
      "steps": [
        "step 1",
        "step 2",
        "step 3"
      ],
      "conditions": {{
        "if_amount_under": "specific action",
        "if_enterprise": "specific action"
      }},
      "exceptions": ["list of exceptions"],
      "escalation_path": "who to escalate to or null",
      "confidence": 0.0 to 1.0
    }}
  ]
}}

Rules:
- Group related nodes into single skills
- Make steps clear and actionable
- Include all conditions and exceptions
- Each skill should be self-contained
- Return valid JSON only

JSON:"""

    try:
        raw = await call_ollama(prompt, max_tokens=3000)
        cleaned = clean_json_response(raw)

        # Try to parse
        try:
            skills_data = json.loads(cleaned)
        except Exception:
            # Fallback: build manually from nodes
            skills_data = build_skills_manually(nodes, org_name)

        # Add metadata
        skills_data["generated_at"] = datetime.now().isoformat()
        skills_data["total_skills"] = len(
            skills_data.get("skills", [])
        )
        skills_data["total_nodes_used"] = len(nodes)

        return skills_data

    except Exception as e:
        print(f"Skills file generation error: {e}")
        return build_skills_manually(nodes, org_name)


def build_skills_manually(
    nodes: list[dict],
    org_name: str
) -> dict:
    """
    Fallback: build skills file directly
    from nodes without AI grouping.
    """
    skills = []

    for i, node in enumerate(nodes):
        skill = {
            "id": f"skill-{i+1}",
            "name": node["title"],
            "description": node["content"][:100] + "..."
            if len(node["content"]) > 100
            else node["content"],
            "trigger_conditions": [
                f"When handling {node['title'].lower()}"
            ],
            "steps": [node["content"]],
            "conditions": {},
            "exceptions": [node["exceptions"]]
            if node.get("exceptions") else [],
            "escalation_path": None,
            "confidence": node.get("confidence_score", 0.8)
        }
        skills.append(skill)

    return {
        "company": org_name,
        "version": "1.0.0",
        "skills": skills
    }


# ─────────────────────────────────────────
# SAVE SKILLS FILE TO DATABASE
# ─────────────────────────────────────────

async def save_skills_file(
    org_id: str,
    org_name: str,
    name: str = "Company Skills"
) -> dict:
    """Generate and save skills file to database"""

    skills_data = await generate_skills_file(org_id, org_name)

    # Save to database
    result = supabase.table("skills_files").insert({
        "org_id": org_id,
        "name": name,
        "description": f"Auto-generated from {skills_data.get('total_nodes_used', 0)} knowledge nodes",
        "version": "1.0.0",
        "status": "draft",
        "content_json": skills_data,
        "node_count": skills_data.get("total_nodes_used", 0),
        "is_published": False
    }).execute()

    if result.data:
        return {
            "id": result.data[0]["id"],
            "skills_file": skills_data
        }

    return {"skills_file": skills_data}


# ─────────────────────────────────────────
# GET SAVED SKILLS FILES
# ─────────────────────────────────────────

def get_skills_files(org_id: str) -> list[dict]:
    """Get all skills files for org"""

    result = supabase.table("skills_files")\
        .select("id, name, description, version, status, node_count, is_published, created_at")\
        .eq("org_id", org_id)\
        .order("created_at", desc=True)\
        .execute()

    return result.data or []


def get_skills_file_by_id(
    skills_file_id: str,
    org_id: str
) -> dict:
    """Get a specific skills file with full content"""

    result = supabase.table("skills_files")\
        .select("*")\
        .eq("id", skills_file_id)\
        .eq("org_id", org_id)\
        .single()\
        .execute()

    return result.data or {}