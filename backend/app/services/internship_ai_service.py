import json

from app.prompts.internship_prompt import INTERNSHIP_PROMPT
from app.ai.gemini import ask_gemini
from app.schemas import InternshipRequest


async def generate_internship_recommendation(
    request: InternshipRequest,
):
    prompt = INTERNSHIP_PROMPT.format(
        skills=request.skills,
        cgpa=request.cgpa,
        location=request.location,
        preferred_role=request.preferred_role,
        preferred_company=request.preferred_company,
        preferred_domain=request.preferred_domain,
        expected_stipend=request.expected_stipend,
        availability=request.availability,
    )

    response = ask_gemini(prompt)

    try:
        return json.loads(response)
    except json.JSONDecodeError:
        return {
            "error": "Gemini returned invalid JSON",
            "raw_response": response
        }