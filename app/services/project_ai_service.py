from app.prompts.project_prompt import PROJECT_PROMPT
from app.services.gemini_service import generate_ai_response


async def generate_project(request):
    prompt = PROJECT_PROMPT.format(
        skills=request.skills,
        interests=request.interests,
        career_goal=request.career_goal,
        preferred_domain=request.preferred_domain,
        experience_level=request.experience_level,
    )

    return await generate_ai_response(prompt)