from app.graph.state import CareerState

from app.utils.llm import extract_resume_info

from app.services.resume_agent import analyze_resume
from app.services.skill_gap_agent import analyze_skill_gap
from app.services.learning_planner_agent import generate_learning_plan

from app.services.memory_service import get_user_memory
from app.services.mentor_service import generate_mentor_report



def resume_agent(state: CareerState):

    print("✅ Resume Agent Running")

    try:

        result = extract_resume_info(
            state["resume_text"]
        )

        resume_info = result.model_dump()


        analysis = analyze_resume(
            resume_info,
            state["target_role"]
        )


        return {

            "resume_info": resume_info,

            "resume_analysis":
                analysis.model_dump(),

            "error": None
        }


    except Exception as e:

        return {
            "error":
            f"Resume analysis failed: {str(e)}"
        }



def skill_gap_agent(state: CareerState):

    print("✅ Skill Gap Agent Running")


    try:

        resume_info = state.get(
            "resume_info"
        )


        if not resume_info:

            return {
                "error":
                "Resume information missing"
            }


        result = analyze_skill_gap(
            resume_info,
            state["target_role"]
        )


        return {

            "skill_gap":
                result.model_dump(),

            "error": None

        }


    except Exception as e:

        return {

            "error":
            f"Skill gap failed: {str(e)}"

        }



def learning_planner_agent(state: CareerState):

    print("✅ Learning Planner Running")


    try:

        result = generate_learning_plan(

            state["resume_info"],

            state["skill_gap"],

            state["target_role"]

        )


        return {

            "career_learning_plan":
                result.model_dump(),

            "error": None

        }


    except Exception as e:


        return {

            "error":
            f"Learning planner failed: {str(e)}"

        }



def project_architect_agent(
        state: CareerState
):

    print("✅ Project Architect Agent")

    state["projects"] = [
        "AI Career Assistant",
        "RAG based Resume Analyzer"
    ]

    return state




def interview_coach_agent(
        state: CareerState
):

    print("✅ Interview Coach Agent")


    state["interview_score"] = 75


    return state




def memory_agent(
        state: CareerState
):

    print("✅ Memory Agent")


    try:

        memory = get_user_memory(
            state["user_email"]
        )


        if memory:

            state["resume_score"] = (
                memory.get(
                    "resume_score",
                    0
                )
            )


            state["skills"] = (
                memory.get(
                    "skills",
                    []
                )
            )


        return state


    except Exception as e:


        state["error"] = (
            f"Memory failed: {str(e)}"
        )


        return state




def mentor_agent(
        state: CareerState
):

    print("✅ Mentor Agent")


    try:

        report = generate_mentor_report(
            state["user_email"]
        )


        return {

            "mentor_report":
                report,

            "error": None

        }


    except Exception as e:


        return {

            "error":
            f"Mentor failed: {str(e)}"

        }
def final_report_agent(state: CareerState):

    print("✅ Final Career Report Agent")

    return {
        "final_report": {

            "resume":
            state.get("resume_analysis"),

            "skill_gap":
            state.get("skill_gap"),

            "learning_plan":
            state.get("career_learning_plan"),

            "projects":
            state.get("projects"),

            "mentor":
            state.get("mentor_report")

        }
    }