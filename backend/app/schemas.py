from pydantic import BaseModel, EmailStr, Field
from pydantic import BaseModel



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

class ProjectRequest(BaseModel):
    skills: str
    career_goal: str
    interests: str
    preferred_domain: str
    experience_level: str
class InternshipRequest(BaseModel):
    skills: str
    cgpa: float
    location: str
    preferred_role: str
    preferred_company: str
    preferred_domain: str
    expected_stipend: str
    availability: str

class ResumeRequest(BaseModel):
    target_role: str
    file_name: str | None = None
    # NOTE (fixed integration gap): this field was missing even though
    # services/resume_ai_service.py's analyze_resume() reads
    # request.resume_text — every call to POST /resume/analyze raised an
    # AttributeError. The frontend also never sent resume content, only
    # a filename. Fixed here + a new POST /resume/upload endpoint that
    # extracts text from an uploaded PDF server-side (see routers/resume.py).
    resume_text: str | None = None
class ResumeResponse(BaseModel):
    overall_score: int
    strengths: list[str]
    weaknesses: list[str]
    improvements: list[str]
    ats_score: int


# -------------------------
# Orchestrator / Agent Schemas
# -------------------------

class OrchestratorRequest(BaseModel):
    """
    Input for the full LangGraph pipeline
    (career_ai -> guidance -> opportunity).
    """
    resume_text: str
    target_role: str
    internship_request: InternshipRequest
    project_request: ProjectRequest


class CareerPipelineRequest(BaseModel):
    """Input for the resume -> skill-gap -> learning-plan agent chain."""
    resume_text: str
    target_role: str


class SkillGapRequest(BaseModel):
    resume_info: dict
    target_role: str


class LearningPlanRequest(BaseModel):
    resume_info: dict
    skill_gap: dict
    target_role: str


class ResumeExtractRequest(BaseModel):
    resume_text: str


class ResumeStructuredAnalyzeRequest(BaseModel):
    resume_info: dict
    target_role: str