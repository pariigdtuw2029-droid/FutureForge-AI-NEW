from pydantic import BaseModel


class InternshipRequest(BaseModel):
    skills: str
    cgpa: float
    location: str
    preferred_role: str
    preferred_company: str
    preferred_domain: str
    expected_stipend: str
    availability: str