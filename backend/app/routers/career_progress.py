from fastapi import APIRouter, Depends, HTTPException, status

from app.database import db
from app.dependencies import get_current_user
from app.models import create_career_progress_document
from app.schemas import CareerProgressCreate

router = APIRouter(
    prefix="/career-progress",
    tags=["Career Progress"]
)


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    summary="Save career progress"
)
def save_career_progress(
    progress: CareerProgressCreate,
    current_user: dict = Depends(get_current_user)
):

    progress_data = create_career_progress_document(
        user_email=current_user["email"],
        current_role=progress.current_role,
        target_role=progress.target_role,
        completed_courses=progress.completed_courses,
        completed_projects=progress.completed_projects,
        progress_percentage=progress.progress_percentage
    )

    db.career_progress.update_one(
        {"user_email": current_user["email"]},
        {"$set": progress_data},
        upsert=True
    )

    return {
        "message": "Career progress saved successfully"
    }


@router.get(
    "/",
    summary="Get career progress"
)
def get_career_progress(
    current_user: dict = Depends(get_current_user)
):

    progress = db.career_progress.find_one(
        {"user_email": current_user["email"]},
        {"_id": 0}
    )

    if not progress:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Career progress not found"
        )

    return progress