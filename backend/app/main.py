from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.database import supabase, settings
from app.api.routes import organizations, ai

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

# Routes
app.include_router(
    organizations.router,
    prefix="/api",
    tags=["organizations"]
)

app.include_router(
    ai.router,
    prefix="/api",
    tags=["ai"]
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
    try:
        supabase.table("organizations")\
            .select("count")\
            .limit(1)\
            .execute()
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "healthy",
        "service": "company-brain-api",
        "database": db_status,
        "environment": settings.app_env
    }