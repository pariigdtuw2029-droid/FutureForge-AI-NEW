from app.prompts.resume_prompt import RESUME_ANALYSIS_PROMPT
from app.services.gemini_service import generate_ai_response


async def analyze_resume_with_ai(resume_text: str) -> dict:
    prompt = RESUME_ANALYSIS_PROMPT.format(
        resume_text=resume_text
    )

    result = await generate_ai_response(prompt)

    return result