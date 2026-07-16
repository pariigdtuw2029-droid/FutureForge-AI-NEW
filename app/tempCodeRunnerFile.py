from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.config import settings
from app.database.mongodb import client
from app.api.routes.auth import router as auth_router
from app.api.routes.resume import router as resume_router
from app.api.routes.project import router as project_router


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

@app.get("/")
async def root():
    return {
        "message": "Welcome to FutureForge AI 🚀"
    }


@app.get("/health")
async def health():
    return {
        "status": "Healthy",
        "database": settings.DATABASE_NAME,
    }
