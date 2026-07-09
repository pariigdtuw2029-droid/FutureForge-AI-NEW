from app.database import db
from app.models import create_memory_document


def save_user_memory(
    user_email: str,
    skills: list,
    goals: list,
    projects: list,
    resume_score: int
):
    """
    Save or update user memory.
    """

    memory_data = create_memory_document(
        user_email=user_email,
        skills=skills,
        goals=goals,
        projects=projects,
        resume_score=resume_score
    )

    db.memory.update_one(
        {"user_email": user_email},
        {"$set": memory_data},
        upsert=True
    )

    return {"message": "Memory saved successfully"}


def get_user_memory(user_email: str):
    """
    Fetch user memory.
    """

    memory = db.memory.find_one(
        {"user_email": user_email},
        {"_id": 0}
    )

    return memory