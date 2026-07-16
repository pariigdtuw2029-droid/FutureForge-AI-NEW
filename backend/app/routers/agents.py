"""
Direct, single-purpose endpoints for agents that previously existed only
as internal LangGraph nodes (app/graph/nodes.py, unused) or were only
reachable indirectly through the multi-step /orchestrator/ pipeline.

Per the integration audit, the following agents had NO standalone route
before this file: resume text extraction, structured resume analysis,
skill-gap analysis, and learning-plan generation. They are exposed here
so each can be called and tested independently (e.g. from Swagger),
without needing to run the full orchestrator chain.
"""

from fastapi import APIRouter, HTTPException, status

from app.schemas import (
    ResumeExtractRequest,
    ResumeStructuredAnalyzeRequest,
    SkillGapRequest,
    LearningPlanRequest,
    CareerPipelineRequest,
)
from app.utils.llm import extract_resume_info
from app.services.resume_agent import analyze_resume
from app.services.skill_gap_agent import analyze_skill_gap
from app.services.learning_planner_agent import generate_learning_plan
from app.services.career_service import run_career_pipeline_from_text
from app.utils.response import success_response

router = APIRouter(
    prefix="/agents",
    tags=["AI Agents"],
)


@router.post(
    "/resume/extract",
    summary="Extract structured info from raw resume text",
)
def resume_extract(payload: ResumeExtractRequest):
    try:
        result = extract_resume_info(payload.resume_text)
        return success_response(result.model_dump(), "Resume info extracted")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post(
    "/resume/analyze-structured",
    summary="Analyze structured resume info against a target role",
    description=(
        "Distinct from POST /resume/analyze, which analyzes raw resume "
        "text via a prompt template. This variant takes already-"
        "structured resume data (e.g. the output of /agents/resume/extract) "
        "and is the version used internally by the career pipeline."
    ),
)
def resume_analyze_structured(payload: ResumeStructuredAnalyzeRequest):
    try:
        result = analyze_resume(payload.resume_info, payload.target_role)
        return success_response(result.model_dump(), "Resume analyzed")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post(
    "/skill-gap",
    summary="Analyze skill gap against a target role (RAG-backed)",
)
def skill_gap(payload: SkillGapRequest):
    try:
        result = analyze_skill_gap(payload.resume_info, payload.target_role)
        return success_response(result.model_dump(), "Skill gap analyzed")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post(
    "/learning-plan",
    summary="Generate a phased learning plan (RAG-backed)",
)
def learning_plan(payload: LearningPlanRequest):
    try:
        result = generate_learning_plan(
            payload.resume_info, payload.skill_gap, payload.target_role
        )
        return success_response(result.model_dump(), "Learning plan generated")
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post(
    "/career-pipeline",
    summary="Run resume -> analysis -> skill-gap -> learning-plan in one call",
    description=(
        "Convenience endpoint chaining resume extraction, resume analysis, "
        "skill-gap analysis, and learning-plan generation from raw resume "
        "text. Equivalent to the career_ai node of the orchestrator graph, "
        "callable on its own without needing internship/project inputs."
    ),
)
def career_pipeline(payload: CareerPipelineRequest):
    result = run_career_pipeline_from_text(payload.resume_text, payload.target_role)
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=result["error"],
        )
    return success_response(result["data"], "Career pipeline completed")
