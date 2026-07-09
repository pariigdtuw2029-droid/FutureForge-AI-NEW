from app.graph.state import CareerState

from app.utils.llm import extract_resume_info
from app.services.resume_agent import analyze_resume
from app.services.skill_gap_agent import analyze_skill_gap
from app.services.learning_planner_agent import generate_learning_plan

from app.services.memory_service import get_user_memory
from app.services.mentor_service import generate_mentor_report


def resume_agent(state: CareerState) -> dict:
    """
    Extract resume info + perform resume analysis.
    """
    print("✅ Resume Agent")

    try:
        result = extract_resume_info(state["resume_text"])
        resume_info = result.model_dump()

        analysis = analyze_resume(resume_info, state["target_role"])

        return {
            "resume_info": resume_info,
            "resume_analysis": analysis.model_dump(),
            "error": None
        }

    except Exception as e:
        return {
            "error": f"Resume analysis failed: {str(e)}"
        }


def skill_gap_agent(state: CareerState) -> dict:
    """
    Analyze skill gaps based on extracted resume info + target role.
    """
    print("✅ Skill Gap Agent")

    try:
        resume_info = state.get("resume_info")
        if not resume_info:
            return {"error": "No resume_info found for skill gap analysis"}

        result = analyze_skill_gap(resume_info, state["target_role"])

        return {
            "skill_gap": result.model_dump(),
            "error": None
        }

    except Exception as e:
        return {
            "error": f"Skill gap analysis failed: {str(e)}"
        }


def learning_planner_agent(state: CareerState) -> dict:
    """
    Generate learning plan from skill gap analysis.
    """
    print("✅ Learning Planner Agent")

    try:
        resume_info = state.get("resume_info")
        skill_gap = state.get("skill_gap")

        if not resume_info:
            return {"error": "No resume_info found for learning planner"}

        if not skill_gap:
            return {"error": "No skill_gap found for learning planner"}

        result = generate_learning_plan(
            resume_info,
            skill_gap,
            state["target_role"]
        )

        return {
            "career_learning_plan": result.model_dump(),
            "error": None
        }

    except Exception as e:
        return {
            "error": f"Learning planner failed: {str(e)}"
        }


def project_architect_agent(state: CareerState) -> CareerState:
    print("✅ Project Architect Agent")
    return state


def interview_coach_agent(state: CareerState) -> CareerState:
    print("✅ Interview Coach Agent")
    return state


def memory_agent(state: CareerState) -> CareerState:
    print("✅ Memory Agent")

    memory = get_user_memory(state["user_email"])

    if memory:
        state["resume_score"] = memory.get("resume_score", 0)
        state["skills"] = memory.get("skills", [])

    return state


def mentor_agent(state: CareerState) -> CareerState:
    """
    Generate AI mentor report and store it in the workflow state.
    """
    print("✅ Mentor Agent")

    report = generate_mentor_report(state["user_email"])
    state["mentor_report"] = report

    return state