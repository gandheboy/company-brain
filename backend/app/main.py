from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import supabase, settings
import os

app = FastAPI(
    title="Company Brain API",
    description="The memory layer for AI-powered companies",
    version="0.1.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "message": "Company Brain API is running",
        "version": "0.1.0",
        "status": "healthy"
    }

@app.get("/health")
def health_check():
    # Test Supabase connection
    try:
        # Simple query to test connection
        result = supabase.table("organizations").select("count").limit(1).execute()
        db_status = "connected"
    except Exception as e:
        db_status = f"not connected — {str(e)}"

    return {
        "status": "healthy",
        "service": "company-brain-api",
        "database": db_status,
        "environment": settings.app_env
    }