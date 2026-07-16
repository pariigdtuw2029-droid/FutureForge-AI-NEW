from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user
from app.graph.workflow import graph
from app.schemas import OrchestratorRequest

router = APIRouter(
    prefix="/orchestrator",
    tags=["LangGraph Orchestrator"]
)


@router.post("/")
async def run_orchestrator(
    payload: OrchestratorRequest,
    current_user: dict = Depends(get_current_user)
):
    initial_state = {
        "user_email": current_user["email"],
        "resume_text": payload.resume_text,
        "target_role": payload.target_role,
        "internship_request": payload.internship_request,
        "project_request": payload.project_request,
    }

    try:
        result = await graph.ainvoke(initial_state)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Orchestrator pipeline failed: {str(e)}"
        )

    if result.get("error"):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=result["error"]
        )

    return {
        "success": True,
        "message": "Workflow completed successfully",
        "data": result,
    }