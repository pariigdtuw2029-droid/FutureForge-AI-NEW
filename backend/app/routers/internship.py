from fastapi import APIRouter

from app.schemas import InternshipRequest
from app.services.internship_controller import recommend_internship
from app.services.internship_service import get_all_internships

router = APIRouter(
    prefix="/internship",
    tags=["Internship Recommendation"],
)


@router.post("/recommend")
async def recommend(data: InternshipRequest):
    return await recommend_internship(data)


@router.get("/history")
async def history():
    return await get_all_internships()