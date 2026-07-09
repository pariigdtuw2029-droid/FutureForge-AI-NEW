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

# Create workflow
workflow = StateGraph(CareerState)

# Add all nodes
workflow.add_node("resume", resume_agent)
workflow.add_node("skill_gap", skill_gap_agent)
workflow.add_node("learning_planner", learning_planner_agent)
workflow.add_node("project_architect", project_architect_agent)
workflow.add_node("interview_coach", interview_coach_agent)
workflow.add_node("memory", memory_agent)
workflow.add_node("mentor", mentor_agent)

# Set starting point
workflow.set_entry_point("resume")

# Connect the nodes
workflow.add_edge("resume", "skill_gap")
workflow.add_edge("skill_gap", "learning_planner")
workflow.add_edge("learning_planner", "project_architect")
workflow.add_edge("project_architect", "interview_coach")
workflow.add_edge("interview_coach", "memory")
workflow.add_edge("memory", "mentor")
workflow.add_edge("mentor", END)

# Compile the workflow
graph = workflow.compile()