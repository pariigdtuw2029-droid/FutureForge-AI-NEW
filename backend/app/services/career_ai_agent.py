from app.utils.llm import extract_resume_info

from app.services.resume_agent import analyze_resume
from app.services.skill_gap_agent import analyze_skill_gap
from app.services.learning_planner_agent import generate_learning_plan


def career_ai_agent(state):

    print("✅ Career AI Agent")

    try:
        resume_info = extract_resume_info(
            state["resume_text"]
        ).model_dump()

        resume_analysis = analyze_resume(
            resume_info,
            state["target_role"]
        ).model_dump()

        skill_gap = analyze_skill_gap(
            resume_info,
            state["target_role"]
        ).model_dump()

        learning_plan = generate_learning_plan(
            resume_info,
            skill_gap,
            state["target_role"]
        ).model_dump()

        return {
            "resume_info": resume_info,
            "resume_analysis": resume_analysis,
            "skill_gap": skill_gap,
            "career_learning_plan": learning_plan,
            "error": None
        }

    except Exception as e:

        return {
            "error": str(e)
        }