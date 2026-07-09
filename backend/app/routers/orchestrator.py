from fastapi import APIRouter, Depends

from app.dependencies import get_current_user
from app.graph.workflow import graph

router = APIRouter(
    prefix="/orchestrator",
    tags=["LangGraph Orchestrator"]
)


@router.post("/")
def run_orchestrator(
    current_user: dict = Depends(get_current_user)
):

    initial_state = {
        "user_email": current_user["email"],
        "resume_score": 0,
        "interview_score": 0,
        "skills": [],
        "skill_gaps": [],
        "learning_plan": [],
        "projects": [],
        "mentor_report": {}
    }

    result = graph.invoke(initial_state)

    return {
        "message": "Workflow completed successfully",
        "state": result
    }