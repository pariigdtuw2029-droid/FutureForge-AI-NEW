from app.graph.workflow import build_career_graph
from app.services.pdf_reader import text_from_pdf

graph = build_career_graph()


def run_career_pipeline_from_text(resume_text: str, target_role: str) -> dict:
    final_state = graph.invoke({
        "resume_text": resume_text,
        "target_role": target_role,
        "resume_info": None,
        "resume_analysis": None,
        "skill_gap": None,
        "learning_plan": None,
        "error": None
    })

    return {
        "success": final_state.get("error") is None,
        "data": {
            "resume_info": final_state.get("resume_info"),
            "resume_analysis": final_state.get("resume_analysis"),
            "skill_gap": final_state.get("skill_gap"),
            "learning_plan": final_state.get("learning_plan"),
        },
        "error": final_state.get("error")
    }


def run_career_pipeline_from_pdf(pdf_path: str, target_role: str) -> dict:
    resume_text = text_from_pdf(pdf_path)
    return run_career_pipeline_from_text(resume_text, target_role)