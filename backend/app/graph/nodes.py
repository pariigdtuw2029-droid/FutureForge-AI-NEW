from app.graph.state import CareerState


def resume_agent(state: CareerState) -> CareerState:
    print("✅ Resume Agent")
    return state


def skill_gap_agent(state: CareerState) -> CareerState:
    print("✅ Skill Gap Agent")
    return state


def learning_planner_agent(state: CareerState) -> CareerState:
    print("✅ Learning Planner Agent")
    return state


def project_architect_agent(state: CareerState) -> CareerState:
    print("✅ Project Architect Agent")
    return state


def interview_coach_agent(state: CareerState) -> CareerState:
    print("✅ Interview Coach Agent")
    return state


from app.services.memory_service import get_user_memory

def memory_agent(state: CareerState) -> CareerState:
    print("✅ Memory Agent")

    memory = get_user_memory(state["user_email"])

    if memory:
        state["resume_score"] = memory["resume_score"]
        state["skills"] = memory["skills"]

    return state


from app.services.mentor_service import generate_mentor_report


def mentor_agent(state: CareerState) -> CareerState:
    """
    Generate AI mentor report and store it in the workflow state.
    """

    print("✅ Mentor Agent")

    report = generate_mentor_report(
        state["user_email"]
    )

    state["mentor_report"] = report

    return state