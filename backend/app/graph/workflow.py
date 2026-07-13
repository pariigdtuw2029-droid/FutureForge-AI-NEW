from langgraph.graph import (
    StateGraph,
    END
)

from app.graph.state import CareerState

from app.services.career_ai_agent import career_ai_agent
from app.services.guidance_agent import guidance_agent
from app.services.oppurtunity_agent import opportunity_agent


workflow = StateGraph(CareerState)

# Nodes
workflow.add_node(
    "career_ai",
    career_ai_agent
)

workflow.add_node(
    "guidance",
    guidance_agent
)

workflow.add_node(
    "opportunity",
    opportunity_agent
)

# Entry
workflow.set_entry_point(
    "career_ai"
)

# Flow
workflow.add_edge(
    "career_ai",
    "guidance"
)

workflow.add_edge(
    "guidance",
    "opportunity"
)

workflow.add_edge(
    "opportunity",
    END
)

graph = workflow.compile()