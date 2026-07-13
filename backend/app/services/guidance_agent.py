from app.services.memory_service import get_user_memory
from app.services.mentor_service import generate_mentor_report


def guidance_agent(state):

    print("✅ Guidance Agent")

    try:

        memory = get_user_memory(
            state["user_email"]
        )

        if memory:

            state["resume_score"] = memory.get(
                "resume_score",
                0
            )

            state["skills"] = memory.get(
                "skills",
                []
            )

        report = generate_mentor_report(
            state["user_email"]
        )

        return {

            "resume_score":
                state.get("resume_score"),

            "skills":
                state.get("skills"),

            "mentor_report":
                report,

            "error": None
        }

    except Exception as e:

        return {

            "error": str(e)

        }