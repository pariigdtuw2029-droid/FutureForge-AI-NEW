from pydantic import BaseModel

from app.services.ai_clients import get_chat_llm

# NOTE (cleanup): this file previously defined its own `ask_gemini()`,
# a near-duplicate of the one in app/ai/gemini.py (missing that version's
# markdown-fence stripping and error handling). Tracing every import in
# the codebase showed this copy was never actually called anywhere —
# dead code that could easily have misled a future maintainer into
# thinking there were two supported ways to call Gemini. Removed; use
# app.ai.gemini.ask_gemini for raw text prompts.


class ExperienceItem(BaseModel):
    role: str
    company: str
    duration_months: int


class ResumeInfo(BaseModel):
    candidate_name: str | None = None
    cgpa: float | None = None
    github: str | None = None
    skills: list[str] = []
    projects: list[str] = []
    education: str | None = None
    experience: list[ExperienceItem] = []
    college_year: int | None = None
    no_of_internships: int | None = None


def extract_resume_info(resume_text: str) -> ResumeInfo:
    structured_llm = get_chat_llm().with_structured_output(ResumeInfo)

    prompt = f""" Extract structured information from the following resume text.
    Return these fields:
    - candidate_name
    - cgpa
    - github
    - skills
    - projects
    - education
    - experience
    - college_year
    - no_of_internships
    Rules:
    - Use only the information present in the resume text.
    - Do not invent details.
    - If a field is missing, return null for single-value fields and [] for list fields.
    - For experience, return a list of objects with: role, company, duration_months
    Resume text:{resume_text} """

    return structured_llm.invoke(prompt)
