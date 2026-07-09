from langgraph.graph import StateGraph, END

from app.graph.state import CareerState
from app.graph.nodes import (
    resume_agent,
    skill_gap_agent,
    learning_planner_agent,
    project_architect_agent,
    interview_coach_agent,
    memory_agent,
    mentor_agent,
)


def route_after_resume(state: CareerState):
    if state.get("error"):
        return "end"

    resume_info = state.get("resume_info")
    if not resume_info:
        return "end"

    if (
        not resume_info.get("candidate_name")
        and not resume_info.get("skills")
        and not resume_info.get("education")
    ):
        return "end"

    return "skill_gap"


def route_after_skill_gap(state: CareerState):
    if state.get("error"):
        return "end"

    skill_gap = state.get("skill_gap")
    if not skill_gap:
        return "end"

    missing_required = skill_gap.get("missing_required_skills", [])
    missing_preferred = skill_gap.get("missing_preferred_skills", [])

    if len(missing_required) == 0 and len(missing_preferred) == 0:
        return "project_architect"

    return "learning_planner"


workflow = StateGraph(CareerState)

workflow.add_node("resume", resume_agent)
workflow.add_node("skill_gap", skill_gap_agent)
workflow.add_node("learning_planner", learning_planner_agent)
workflow.add_node("project_architect", project_architect_agent)
workflow.add_node("interview_coach", interview_coach_agent)
workflow.add_node("memory", memory_agent)
workflow.add_node("mentor", mentor_agent)

workflow.set_entry_point("resume")

workflow.add_conditional_edges(
    "resume",
    route_after_resume,
    {
        "skill_gap": "skill_gap",
        "end": END
    }
)

workflow.add_conditional_edges(
    "skill_gap",
    route_after_skill_gap,
    {
        "learning_planner": "learning_planner",
        "project_architect": "project_architect",
        "end": END
    }
)

workflow.add_edge("learning_planner", "project_architect")
workflow.add_edge("project_architect", "interview_coach")
workflow.add_edge("interview_coach", "memory")
workflow.add_edge("memory", "mentor")
workflow.add_edge("mentor", END)

graph = workflow.compile()