import logging

from fastapi import APIRouter, HTTPException

from app.schemas import InternshipRequest
from app.services.internship_controller import recommend_internship
from app.services.internship_service import get_all_internships

logger = logging.getLogger("futureforge")

router = APIRouter(
    prefix="/internship",
    tags=["Internship Recommendation"],
)


@router.post("/recommend")
async def recommend(data: InternshipRequest):

    try:
        return await recommend_internship(data)

    except Exception as e:

        logger.exception("Internship recommendation failed")

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.get("/history")
async def history():
    return get_all_internships()
