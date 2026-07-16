from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user
from app.schemas import MemoryCreate
from app.services.memory_service import (
    save_user_memory,
    get_user_memory
)

router = APIRouter(
    prefix="/memory",
    tags=["Memory"]
)


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    summary="Save User Memory",
    description="Creates or updates the authenticated user's memory."
)
def save_memory(
    memory: MemoryCreate,
    current_user: dict = Depends(get_current_user)
):

    return save_user_memory(
        user_email=current_user["email"],
        skills=memory.skills,
        goals=memory.goals,
        projects=memory.projects,
        resume_score=memory.resume_score
    )


@router.get(
    "/",
    summary="Get User Memory",
    description="Returns the authenticated user's saved memory."
)
def get_memory(
    current_user: dict = Depends(get_current_user)
):

    memory = get_user_memory(current_user["email"])

    if not memory:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Memory not found"
        )

    return memory
