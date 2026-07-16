from app.prompts.internship_prompt import INTERNSHIP_PROMPT
from app.services.gemini_service import generate_ai_response
from app.schemas.internship_schema import InternshipRequest


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

    response = await generate_ai_response(prompt)

    return response