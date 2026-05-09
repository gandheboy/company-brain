from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from app.core.auth import get_current_user, get_current_org
from app.core.database import supabase, settings
import httpx
from app.services.slack_service import ingest_slack_workspace
import asyncio
from app.services.notion_service import ingest_notion_workspace

router = APIRouter()

@router.get("/integrations/slack/connect-url")
async def slack_connect_url_test():
    """
    Get Slack OAuth URL without auth.
    For development testing only.
    """
    if not settings.slack_client_id:
        raise HTTPException(
            status_code=500,
            detail="Slack client ID not configured. Check your .env file."
        )

    # Get first org for testing
    orgs = supabase.table("organizations")\
        .select("id")\
        .limit(1)\
        .execute()

    if not orgs.data:
        raise HTTPException(
            status_code=400,
            detail="No organizations found."
        )

    org_id = orgs.data[0]["id"]

    slack_oauth_url = (
        f"https://slack.com/oauth/v2/authorize"
        f"?client_id={settings.slack_client_id}"
        f"&scope=channels:history,channels:read,users:read,team:read"
        f"&redirect_uri={settings.slack_redirect_uri}"
        f"&state={org_id}"
    )

    return {
        "oauth_url": slack_oauth_url,
        "org_id": org_id,
        "instruction": "Open oauth_url in your browser to connect Slack"
    }


# ─────────────────────────────────────────
# SLACK OAUTH — STEP 1
# Start the OAuth flow
# ─────────────────────────────────────────

@router.get("/integrations/slack/connect")
async def slack_connect(current_org=Depends(get_current_org)):
    """
    Generate Slack OAuth URL.
    Frontend redirects user here to start connecting.
    """
    if not settings.slack_client_id:
        raise HTTPException(
            status_code=500,
            detail="Slack client ID not configured"
        )

    # Build OAuth URL
    slack_oauth_url = (
        f"https://slack.com/oauth/v2/authorize"
        f"?client_id={settings.slack_client_id}"
        f"&scope=channels:history,channels:read,users:read,team:read"
        f"&redirect_uri={settings.slack_redirect_uri}"
        f"&state={current_org['id']}"
    )

    return {"oauth_url": slack_oauth_url}


# ─────────────────────────────────────────
# SLACK OAUTH — STEP 2
# Handle callback after user approves
# ─────────────────────────────────────────

@router.get("/integrations/slack/callback")
async def slack_callback(code: str, state: str):
    """
    Slack redirects here after user approves.
    Exchange code for access token.
    state = org_id
    """

    if not code:
        raise HTTPException(status_code=400, detail="No code provided")

    # Exchange code for token
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://slack.com/api/oauth.v2.access",
            data={
                "client_id": settings.slack_client_id,
                "client_secret": settings.slack_client_secret,
                "code": code,
                "redirect_uri": settings.slack_redirect_uri
            }
        )
        token_data = response.json()

    if not token_data.get("ok"):
        error = token_data.get("error", "Unknown error")
        return RedirectResponse(
            url=f"{settings.frontend_url}/dashboard?error=slack_auth_failed&reason={error}"
        )

    # Extract token info
    access_token = token_data.get("access_token")
    team_id = token_data.get("team", {}).get("id")
    team_name = token_data.get("team", {}).get("name")
    org_id = state

    # Save integration to database
    existing = supabase.table("integrations")\
        .select("id")\
        .eq("org_id", org_id)\
        .eq("type", "slack")\
        .execute()

    if existing.data:
        # Update existing
        supabase.table("integrations")\
            .update({
                "access_token": access_token,
                "workspace_id": team_id,
                "workspace_name": team_name,
                "status": "active"
            })\
            .eq("org_id", org_id)\
            .eq("type", "slack")\
            .execute()
    else:
        # Create new
        supabase.table("integrations").insert({
            "org_id": org_id,
            "type": "slack",
            "access_token": access_token,
            "workspace_id": team_id,
            "workspace_name": team_name,
            "status": "active"
        }).execute()

    # Redirect back to dashboard with success
    return RedirectResponse(
        url=f"{settings.frontend_url}/dashboard?connected=slack"
    )


# ─────────────────────────────────────────
# GET ALL INTEGRATIONS FOR ORG
# ─────────────────────────────────────────

@router.get("/integrations")
async def get_integrations(current_org=Depends(get_current_org)):
    """Get all integrations for this organization"""

    result = supabase.table("integrations")\
        .select("id, type, status, workspace_name, last_synced_at, total_documents, created_at")\
        .eq("org_id", current_org["id"])\
        .execute()

    return {
        "integrations": result.data or []
    }


# ─────────────────────────────────────────
# DISCONNECT INTEGRATION
# ─────────────────────────────────────────

@router.delete("/integrations/{integration_id}")
async def disconnect_integration(
    integration_id: str,
    current_org=Depends(get_current_org)
):
    """Disconnect an integration"""

    supabase.table("integrations")\
        .delete()\
        .eq("id", integration_id)\
        .eq("org_id", current_org["id"])\
        .execute()

    return {"message": "Integration disconnected"}

# ─────────────────────────────────────────
# TRIGGER SLACK SYNC
# ─────────────────────────────────────────

@router.post("/integrations/slack/sync")
async def sync_slack(current_org=Depends(get_current_org)):
    """
    Manually trigger Slack ingestion.
    Pulls messages and extracts knowledge.
    """

    # Get Slack integration
    integration = supabase.table("integrations")\
        .select("*")\
        .eq("org_id", current_org["id"])\
        .eq("type", "slack")\
        .eq("status", "active")\
        .single()\
        .execute()

    if not integration.data:
        raise HTTPException(
            status_code=404,
            detail="Slack not connected. Please connect Slack first."
        )

    integration_data = integration.data

    # Run ingestion
    stats = await ingest_slack_workspace(
        org_id=current_org["id"],
        integration_id=integration_data["id"],
        token=integration_data["access_token"]
    )

    return {
        "message": "Slack sync complete",
        "stats": stats
    }


@router.get("/integrations/slack/status")
async def slack_status(current_org=Depends(get_current_org)):
    """Check if Slack is connected"""

    integration = supabase.table("integrations")\
        .select("id, status, workspace_name, last_synced_at, total_documents")\
        .eq("org_id", current_org["id"])\
        .eq("type", "slack")\
        .execute()

    if not integration.data:
        return {
            "connected": False,
            "workspace": None
        }

    return {
        "connected": True,
        "workspace": integration.data[0]["workspace_name"],
        "last_synced": integration.data[0]["last_synced_at"],
        "total_documents": integration.data[0]["total_documents"]
    }

@router.post("/integrations/slack/sync-test")
async def sync_slack_test():
    """
    Trigger Slack sync without auth.
    Development testing only.
    """
    # Get first org
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

    # Get Slack integration
    integration = supabase.table("integrations")\
        .select("*")\
        .eq("org_id", org_id)\
        .eq("type", "slack")\
        .execute()

    if not integration.data:
        raise HTTPException(
            status_code=404,
            detail="Slack not connected."
        )

    integration_data = integration.data[0]

    # Run ingestion
    stats = await ingest_slack_workspace(
        org_id=org_id,
        integration_id=integration_data["id"],
        token=integration_data["access_token"]
    )

    return {
        "message": "Slack sync complete",
        "workspace": integration_data["workspace_name"],
        "stats": stats
    }

# ─────────────────────────────────────────
# NOTION INTEGRATION
# ─────────────────────────────────────────

@router.post("/integrations/notion/sync-test")
async def sync_notion_test():
    """
    Trigger Notion sync without auth.
    Development testing only.
    """
    if not settings.notion_api_key:
        raise HTTPException(
            status_code=500,
            detail="Notion API key not configured. Add NOTION_API_KEY to .env"
        )

    # Get first org
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

    # Check if integration exists
    existing = supabase.table("integrations")\
        .select("id")\
        .eq("org_id", org_id)\
        .eq("type", "notion")\
        .execute()

    if existing.data:
        integration_id = existing.data[0]["id"]
    else:
        # Create integration record
        result = supabase.table("integrations").insert({
            "org_id": org_id,
            "type": "notion",
            "status": "active",
            "workspace_name": "Notion Workspace"
        }).execute()
        integration_id = result.data[0]["id"]

    # Run ingestion
    stats = await ingest_notion_workspace(
        org_id=org_id,
        integration_id=integration_id
    )

    return {
        "message": "Notion sync complete",
        "stats": stats
    }


@router.get("/integrations/notion/status")
async def notion_status(current_org=Depends(get_current_org)):
    """Check if Notion is connected"""

    integration = supabase.table("integrations")\
        .select("id, status, last_synced_at, total_documents")\
        .eq("org_id", current_org["id"])\
        .eq("type", "notion")\
        .execute()

    if not integration.data:
        return {"connected": False}

    return {
        "connected": True,
        "last_synced": integration.data[0]["last_synced_at"],
        "total_documents": integration.data[0]["total_documents"]
    }