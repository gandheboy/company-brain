from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from app.core.auth import get_current_user, get_current_org
from app.core.database import supabase, settings
import httpx

router = APIRouter()


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