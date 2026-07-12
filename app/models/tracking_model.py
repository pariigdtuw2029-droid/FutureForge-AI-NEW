from datetime import UTC, datetime
from uuid import uuid4

from pydantic import BaseModel, Field


class TrackingModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str

    completed_roadmaps: int = 0
    generated_projects: int = 0
    applied_internships: int = 0
    viewed_recommendations: int = 0
    resume_versions: int = 1
    progress_percentage: float = 0.0

    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))