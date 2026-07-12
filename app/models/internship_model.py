from datetime import UTC, datetime
from typing import List, Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class InternshipModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str

    preferred_role: str
    preferred_domain: str
    preferred_company: Optional[str] = None
    location: Optional[str] = None
    expected_stipend: Optional[str] = None

    recommended_roles: List[str] = []
    matching_score: float = 0.0
    missing_skills: List[str] = []
    learning_suggestions: List[str] = []
    interview_tips: List[str] = []
    application_strategy: Optional[str] = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))