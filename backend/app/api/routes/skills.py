from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from app.core.auth import get_current_user, get_current_org
from app.core.database import supabase
from app.services.skills_service import (
    generate_skills_file,
    save_skills_file,
    get_skills_files,
    get_skills_file_by_id
)

router = APIRouter()


# ─────────────────────────────────────────
# NO AUTH TEST ENDPOINTS
# ─────────────────────────────────────────

@router.post("/skills/generate-test")
async def generate_skills_test():
    """Generate skills file without auth. Dev only."""

    orgs = supabase.table("organizations")\
        .select("id, name")\
        .limit(1)\
        .execute()

    if not orgs.data:
        raise HTTPException(
            status_code=400,
            detail="No organizations found."
        )

    org = orgs.data[0]

    result = await save_skills_file(
        org_id=org["id"],
        org_name=org["name"],
        name="Auto-Generated Skills"
    )

    return result


@router.get("/skills/list-test")
async def list_skills_test():
    """List skills files without auth. Dev only."""

    orgs = supabase.table("organizations")\
        .select("id")\
        .limit(1)\
        .execute()

    if not orgs.data:
        raise HTTPException(
            status_code=400,
            detail="No organizations found."
        )

    files = get_skills_files(orgs.data[0]["id"])

    return {
        "total": len(files),
        "skills_files": files
    }


# ─────────────────────────────────────────
# AUTH REQUIRED ENDPOINTS
# ─────────────────────────────────────────

@router.post("/skills/generate")
async def generate_skills(
    current_org=Depends(get_current_org)
):
    """Generate and save skills file"""

    result = await save_skills_file(
        org_id=current_org["id"],
        org_name=current_org["name"]
    )

    return result


@router.get("/skills")
async def list_skills(
    current_org=Depends(get_current_org)
):
    """Get all skills files"""

    files = get_skills_files(current_org["id"])

    return {
        "total": len(files),
        "skills_files": files
    }


@router.get("/skills/{skills_file_id}")
async def get_skills(
    skills_file_id: str,
    current_org=Depends(get_current_org)
):
    """Get specific skills file"""

    file = get_skills_file_by_id(
        skills_file_id,
        current_org["id"]
    )

    if not file:
        raise HTTPException(
            status_code=404,
            detail="Skills file not found"
        )

    return file


@router.get("/skills/{skills_file_id}/download")
async def download_skills(
    skills_file_id: str,
    current_org=Depends(get_current_org)
):
    """Download skills file as JSON"""

    file = get_skills_file_by_id(
        skills_file_id,
        current_org["id"]
    )

    if not file:
        raise HTTPException(
            status_code=404,
            detail="Skills file not found"
        )

    return JSONResponse(
        content=file.get("content_json", {}),
        headers={
            "Content-Disposition": f"attachment; filename=skills-{skills_file_id[:8]}.json"
        }
    )