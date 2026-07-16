from datetime import UTC, datetime
from typing import List, Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class ProjectModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str

    project_title: str
    problem_statement: str
    description: str

    difficulty: str
    estimated_duration: str

    technologies: List[str]
    tech_stack: List[str]

    prerequisites: List[str]
    features: List[str]

    future_scope: Optional[str] = None
    resume_value: Optional[str] = None

    github_structure: Optional[str] = None
    learning_roadmap: Optional[str] = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))