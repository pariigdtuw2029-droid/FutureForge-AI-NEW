from pydantic import BaseModel, EmailStr, Field


# -------------------------
# User Schemas
# -------------------------

class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


# -------------------------
# Memory Agent Schemas
# -------------------------

class MemoryCreate(BaseModel):
    skills: list[str]
    goals: list[str]
    projects: list[str]
    resume_score: int = Field(..., ge=0, le=100)
class CareerProgressCreate(BaseModel):
    current_role: str
    target_role: str
    completed_courses: list[str]
    completed_projects: list[str]
    progress_percentage: int


class WeeklyReportCreate(BaseModel):
    week: str
    completed_tasks: list[str]
    pending_tasks: list[str]
    hours_studied: int
    report_summary: str
class MentorResponse(BaseModel):
    career_health: int
    strengths: list[str]
    weaknesses: list[str]
    recommendations: list[str]
class MentorResponse(BaseModel):
    career_health: int
    strengths: list[str]
    weaknesses: list[str]
    recommendations: list[str]