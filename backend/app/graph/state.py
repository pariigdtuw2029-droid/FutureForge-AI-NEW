from typing import TypedDict, Optional, Any


class CareerState(TypedDict, total=False):
    """
    Shared state passed between LangGraph agents.
    """

    # User
    user_email: str

    # Basic career metrics
    resume_score: int
    interview_score: int

    # User profile
    skills: list[str]
    skill_gaps: list[str]
    projects: list[str]

    # Agents output
    mentor_report: dict
    learning_plan: list[str]

    # Resume pipeline
    resume_text: str
    target_role: str

    resume_info: Optional[dict[str, Any]]
    resume_analysis: Optional[dict[str, Any]]

    skill_gap: Optional[dict[str, Any]]

    career_learning_plan: Optional[dict[str, Any]]

    # final status
    error: Optional[str]

    # Opportunity Agent
    internship_request: Optional[Any]
    project_request: Optional[Any]

    internship_result: Optional[dict[str, Any]]
    project_result: Optional[dict[str, Any]]

    # Final report
    final_report: Optional[dict[str, Any]]