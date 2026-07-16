from fastapi import FastAPI

from app.database import db
from app.routers.auth import router as auth_router
from app.routers.memory import router as memory_router
from app.routers.dashboard import router as dashboard_router
from app.routers.career_progress import router as career_progress_router
from app.routers.mentor import router as mentor_router
from app.routers.orchestrator import router as orchestrator_router
from app.routers.project import router as project_router
from app.routers.internship import router as internship_router

app = FastAPI(
    title="FutureForge AI Backend",
    description="AI Career Operating System Backend",
    version="1.0.0"
)


# -------------------------
# Register Routers
# -------------------------

app.include_router(auth_router)
app.include_router(memory_router)
app.include_router(dashboard_router)
app.include_router(mentor_router)
app.include_router(orchestrator_router)
app.include_router(career_progress_router)
app.include_router(project_router)
app.include_router(internship_router)
# -------------------------
# Startup Event
# -------------------------

@app.on_event("startup")
def startup():
    print("✅ Connected to MongoDB")


# -------------------------
# Home Route
# -------------------------

@app.get("/", tags=["Home"])
def home():
    return {
        "project": "FutureForge AI",
        "status": "Backend Running",
        "version": "1.0.0",
        "message": "Welcome to FutureForge AI 🚀"
    }