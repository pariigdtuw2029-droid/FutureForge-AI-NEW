from app.services.pdf_reader import text_from_pdf
from app.services.career_ai_agent import career_ai_agent

# NOTE (fixed integration gap):
# This previously imported `build_career_graph` from `app.graph.workflow`,
# a function that does not exist there (only a pre-built `graph` object
# does, and it is wired for a different state shape: user_email /
# internship_request / project_request, not resume_text). That made this
# module raise ImportError the moment anything tried to use it, so it was
# never wired into a router. `career_ai_agent` already implements exactly
# the resume -> resume analysis -> skill gap -> learning plan chain this
# function is meant to expose, so we call it directly instead.


def run_career_pipeline_from_text(resume_text: str, target_role: str) -> dict:
    final_state = career_ai_agent({
        "resume_text": resume_text,
        "target_role": target_role,
    })

    return {
        "success": final_state.get("error") is None,
        "data": {
            "resume_info": final_state.get("resume_info"),
            "resume_analysis": final_state.get("resume_analysis"),
            "skill_gap": final_state.get("skill_gap"),
            "learning_plan": final_state.get("career_learning_plan"),
        },
        "error": final_state.get("error")
    }


def run_career_pipeline_from_pdf(pdf_path: str, target_role: str) -> dict:
    resume_text = text_from_pdf(pdf_path)
    return run_career_pipeline_from_text(resume_text, target_role)