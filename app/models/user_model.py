from datetime import datetime,UTC
from typing import Optional
from uuid import uuid4

from pydantic import BaseModel, EmailStr, Field


class UserModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    full_name: str
    email: EmailStr
    password: str

    role: str = "student"
    profile_image: Optional[str] = None

    is_active: bool = True
    is_verified: bool = False

created_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
updated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))