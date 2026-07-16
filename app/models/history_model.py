from datetime import UTC, datetime
from typing import Optional
from uuid import uuid4

from pydantic import BaseModel, Field


class HistoryModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str

    history_type: str  # project, internship, roadmap, resume
    title: str
    description: Optional[str] = None

    created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))