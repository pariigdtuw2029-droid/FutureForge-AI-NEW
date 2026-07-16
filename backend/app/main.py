import logging

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from app.database import db
from app.routers.auth import router as auth_router
from app.routers.memory import router as memory_router
from app.routers.dashboard import router as dashboard_router
from app.routers.career_progress import router as career_progress_router
from app.routers.mentor import router as mentor_router
from app.routers.orchestrator import router as orchestrator_router
from app.routers.project import router as project_router
from app.routers.internship import router as internship_router
from app.routers.resume import router as resume_router
from app.routers.agents import router as agents_router

# -------------------------
# Logging
# -------------------------

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger("futureforge")

app = FastAPI(
    title="FutureForge AI Backend",
    description="AI Career Operating System Backend",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://localhost:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
app.include_router(resume_router)
app.include_router(agents_router)

# -------------------------
# Startup Event
# -------------------------

@app.on_event("startup")
def startup():
    logger.info("✅ Connected to MongoDB")


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


@app.get("/health", tags=["Home"])
def health():
    return {"status": "healthy"}


# -------------------------
# Centralized error handling
# Standardizes every error response to {"success": false, "data": null,
# "message": "..."} instead of each route needing to format its own.
# -------------------------

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning("HTTPException on %s: %s", request.url.path, exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content={"success": False, "data": None, "message": str(exc.detail)},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning("Validation error on %s: %s", request.url.path, exc.errors())
    return JSONResponse(
        status_code=422,
        content={"success": False, "data": exc.errors(), "message": "Validation error"},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s", request.url.path)
    return JSONResponse(
        status_code=500,
        content={"success": False, "data": None, "message": "Internal server error"},
    )