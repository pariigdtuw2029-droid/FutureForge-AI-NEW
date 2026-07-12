from pydantic import BaseModel


class RoadmapRequest(BaseModel):
    skills: str
    career_goal: str
    experience_level: str
    duration: str