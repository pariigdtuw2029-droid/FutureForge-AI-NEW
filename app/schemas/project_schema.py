from pydantic import BaseModel


class ProjectRequest(BaseModel):
    skills: str
    career_goal: str
    interests: str
    preferred_domain: str
    experience_level: str