from fastapi import APIRouter, Depends, HTTPException

from app.database import db
from app.dependencies import get_current_user

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)
@router.get("/")
def get_dashboard(
    current_user: dict = Depends(get_current_user)
):

    memory = db.memory.find_one(
        {"user_email": current_user["email"]},
        {"_id": 0}
    )

    if not memory:
        raise HTTPException(
            status_code=404,
            detail="Memory not found"
        )

    return {
        "user": current_user["email"],
        "goal": memory["goals"],
        "skills": memory["skills"],
        "projects": memory["projects"],
        "resume_score": memory["resume_score"]
    }
@router.get("/stats")
def get_stats(current_user: dict = Depends(get_current_user)):

    memory = db.memory.find_one(
        {"user_email": current_user["email"]}
    )

    if not memory:
        raise HTTPException(
            status_code=404,
            detail="Memory not found"
        )

    return {
        "total_skills": len(memory["skills"]),
        "total_goals": len(memory["goals"]),
        "total_projects": len(memory["projects"]),
        "resume_score": memory["resume_score"]
    }