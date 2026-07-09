from typing import TypedDict, Optional, Any


class CareerState(TypedDict, total=False):
    """
    Shared workflow state across all agents.
    """

    #existing global/team fields
    user_email: str
    resume_score: int
    interview_score: int
    skills: list[str]
    skill_gaps: list[str]
    learning_plan: list[str]
    projects: list[str]
    mentor_report: dict

    #resume-career pipeline fields
    resume_text: str
    target_role: str

    resume_info: Optional[dict[str, Any]]
    resume_analysis: Optional[dict[str, Any]]
    skill_gap: Optional[dict[str, Any]]
    career_learning_plan: Optional[dict[str, Any]]

    error: Optional[str]