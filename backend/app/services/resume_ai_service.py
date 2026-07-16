import json

from app.ai.gemini import ask_gemini
from app.prompts.resume_prompt import RESUME_PROMPT
from app.schemas import ResumeRequest


async def analyze_resume(request: ResumeRequest):
    """
    Sends the resume text to Gemini and returns the analysis.
    """

    prompt = RESUME_PROMPT.format(
        resume_text=request.resume_text
    )

    response = ask_gemini(prompt)

    try:
        return json.loads(response)

    except json.JSONDecodeError:

        return {
            "error": "Gemini returned invalid JSON",
            "raw_response": response
        }