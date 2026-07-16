from pydantic import BaseModel

from app.services.ai_clients import get_chat_llm


class ResumeAnalysis(BaseModel):
    strengths: list[str]
    weaknesses: list[str]
    missing_keywords: list[str]
    fit_summary: str


def analyze_resume(resume_info: dict, target_role: str) -> ResumeAnalysis:
    structured_llm = get_chat_llm().with_structured_output(ResumeAnalysis)

    prompt = f"""
    You are a Resume Intelligence Agent.

    Analyze the following resume for the target role: {target_role}

    Resume:
    {resume_info}

    Return analysis with these fields:
    - strengths
    - weaknesses
    - missing_keywords
    - fit_summary

    Rules:
    - strengths: strong points of the candidate relevant to the target role
    - weaknesses: missing or weak areas in the resume for that role
    - missing_keywords: important skills/keywords expected for the role but not present in the resume
    - fit_summary: 2-3 line summary of how well the resume fits the role
    - Use only reasonable role expectations; do not invent resume details
    - Return empty lists if needed
    """

    return structured_llm.invoke(prompt)
