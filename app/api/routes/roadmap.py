from fastapi import APIRouter

from app.controllers.roadmap_controller import generate_roadmap_controller
from app.schemas.roadmap_schema import RoadmapRequest
from app.services.roadmap_service import get_all_roadmaps

router = APIRouter(
    prefix="/roadmap",
    tags=["Technical Roadmap"],
)


@router.post("/generate")
async def generate(data: RoadmapRequest):
    return await generate_roadmap_controller(data)


@router.get("/history")
async def history():
    return await get_all_roadmaps()