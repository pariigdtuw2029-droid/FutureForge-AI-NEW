from datetime import UTC, datetime
from uuid import uuid4

from pydantic import BaseModel, Field


class SessionModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str

    login_time: datetime = Field(default_factory=lambda: datetime.now(UTC))
    logout_time: datetime | None = None
    is_active: bool = True