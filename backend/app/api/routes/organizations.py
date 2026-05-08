from fastapi import APIRouter, Depends, HTTPException
from app.core.auth import get_current_user, get_current_org
from app.core.database import supabase
from pydantic import BaseModel
import re

router = APIRouter()


class CreateOrgRequest(BaseModel):
    name: str
    owner_email: str


def slugify(text: str) -> str:
    """Convert company name to URL-safe slug"""
    text = text.lower()
    text = re.sub(r'[^a-z0-9\s-]', '', text)
    text = re.sub(r'[\s-]+', '-', text)
    text = text.strip('-')
    return text


@router.post("/organizations")
async def create_organization(
    request: CreateOrgRequest,
    current_user=Depends(get_current_user)
):
    """Create organization on user signup"""

    # Check if org already exists for this email
    existing = supabase.table("organizations")\
        .select("id")\
        .eq("owner_email", request.owner_email)\
        .execute()

    if existing.data:
        return existing.data[0]

    # Generate unique slug
    base_slug = slugify(request.name)
    slug = base_slug
    counter = 1

    while True:
        slug_check = supabase.table("organizations")\
            .select("id")\
            .eq("slug", slug)\
            .execute()

        if not slug_check.data:
            break

        slug = f"{base_slug}-{counter}"
        counter += 1

    # Create organization
    result = supabase.table("organizations").insert({
        "name": request.name,
        "slug": slug,
        "owner_email": request.owner_email,
        "plan": "free"
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create organization")

    # Create user record
    supabase.table("users").insert({
        "org_id": result.data[0]["id"],
        "email": request.owner_email,
        "full_name": request.name,
        "role": "owner"
    }).execute()

    return result.data[0]


@router.get("/organizations/me")
async def get_my_organization(
    current_org=Depends(get_current_org)
):
    """Get current user's organization"""
    return current_org


@router.get("/organizations/me/stats")
async def get_org_stats(
    current_org=Depends(get_current_org)
):
    """Get organization statistics for dashboard"""

    org_id = current_org["id"]

    # Count integrations
    integrations = supabase.table("integrations")\
        .select("id", count="exact")\
        .eq("org_id", org_id)\
        .execute()

    # Count knowledge nodes
    nodes = supabase.table("knowledge_nodes")\
        .select("id", count="exact")\
        .eq("org_id", org_id)\
        .execute()

    # Count documents
    documents = supabase.table("documents")\
        .select("id", count="exact")\
        .eq("org_id", org_id)\
        .execute()

    return {
        "org": current_org,
        "stats": {
            "integrations": integrations.count or 0,
            "knowledge_nodes": nodes.count or 0,
            "documents": documents.count or 0
        }
    }