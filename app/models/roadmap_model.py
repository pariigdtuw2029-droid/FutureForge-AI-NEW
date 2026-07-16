from datetime import UTC, datetime
from typing import List
from uuid import uuid4

from pydantic import BaseModel, Field


class RoadmapModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str

    career_goal: str
    current_skills: List[str]
    weekly_plan: List[str]
    monthly_plan: List[str]
    resources: List[str]
    mini_projects: List[str]
    major_projects: List[str]

    progress: float = 0.0

    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))