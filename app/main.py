from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.config import settings
from app.database.mongodb import client
from app.api.routes.auth import router as auth_router
from app.api.routes.resume import router as resume_router
from app.api.routes.project import router as project_router
from app.api.routes.internship import router as internship_router
from app.api.routes.roadmap import router as roadmap_router
from app.api.routes.dashboard import router as dashboard_router
from app.api.routes.analytics import router as analytics_router
@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 FutureForge AI Started")

    try:
        await client.admin.command("ping")
        print("✅ MongoDB Connected Successfully")
    except Exception as e:
        print("❌ MongoDB Connection Failed")
        print(e)

    yield

    client.close()
    print("🛑 Server Stopped")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Career Intelligence Platform",
    lifespan=lifespan,
)

app.include_router(auth_router)
app.include_router(resume_router)
app.include_router(project_router)
app.include_router(internship_router)
app.include_router(roadmap_router)
app.include_router(dashboard_router)
app.include_router(analytics_router)
@app.get("/")
async def root():
    return {
        "message": "Welcome to FutureForge AI 🚀"
    }


@app.get("/health")
async def health():
    return {
        "status": "Healthy",
        "service": "FutureForge AI",
        "database": settings.DATABASE_NAME,
        "version": settings.APP_VERSION
    }