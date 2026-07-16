from fastapi import APIRouter

from app.controllers.project_controller import generate_project_architecture
from app.schemas.project_schema import ProjectRequest
from app.services.project_service import get_all_projects

router = APIRouter(
    prefix="/project",
    tags=["Project Architect"],
)


@router.post("/generate")
async def generate(data: ProjectRequest):
    return await generate_project_architecture(data)


@router.get("/history")
async def history():
    return await get_all_projects()