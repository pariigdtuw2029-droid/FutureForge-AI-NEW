from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user
from app.schemas import MentorResponse
from app.services.mentor_service import generate_mentor_report

router = APIRouter(
    prefix="/mentor",
    tags=["Mentor Agent"]
)


@router.get(
    "/",
    response_model=MentorResponse,
    summary="Get AI Mentor Report",
    description="Generates AI-powered career recommendations."
)
def mentor_report(
    current_user: dict = Depends(get_current_user)
):

    try:
        report = generate_mentor_report(
            current_user["email"]
        )

        return MentorResponse(**report)

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )