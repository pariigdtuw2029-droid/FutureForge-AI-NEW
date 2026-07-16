from datetime import UTC, datetime
from typing import List, Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class ResumeModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str

    file_name: str
    file_type: str

    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

    skills: List[str] = []
    education: List[str] = []
    experience: List[str] = []
    projects: List[str] = []
    certificates: List[str] = []
    achievements: List[str] = []
    programming_languages: List[str] = []
    frameworks: List[str] = []
    soft_skills: List[str] = []

    ats_score: float = 0.0
    strengths: List[str] = []
    weaknesses: List[str] = []
    suggestions: List[str] = []
    summary: Optional[str] = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))