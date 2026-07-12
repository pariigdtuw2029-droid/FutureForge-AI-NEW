from fastapi import APIRouter

from app.schemas import ProjectRequest
from app.services.project_ai_service import generate_project

router = APIRouter(
    prefix="/project",
    tags=["Project Architect"],
)


@router.post("/generate")
async def generate(data: ProjectRequest):
    return await generate_project(data)