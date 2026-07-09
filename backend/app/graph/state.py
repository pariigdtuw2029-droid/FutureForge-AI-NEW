from typing import TypedDict


class CareerState(TypedDict):
    """
    This is the shared data that flows through every agent.
    """

    user_email: str

    resume_score: int

    interview_score: int

    skills: list[str]

    skill_gaps: list[str]

    learning_plan: list[str]

    projects: list[str]

    mentor_report: dict