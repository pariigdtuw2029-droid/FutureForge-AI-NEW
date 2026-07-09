from app.services.gemini_service import ask_gemini
from app.prompts.resume_prompt import get_resume_prompt


def analyze_resume(resume_text: str):

    prompt = get_resume_prompt(resume_text)

    return ask_gemini(prompt)