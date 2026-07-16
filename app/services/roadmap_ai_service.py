from app.prompts.roadmap_prompt import ROADMAP_PROMPT
from app.services.gemini_service import generate_ai_response


async def generate_roadmap(request):
    prompt = ROADMAP_PROMPT.format(
        skills=request.skills,
        career_goal=request.career_goal,
        experience_level=request.experience_level,
        duration=request.duration,
    )

    return await generate_ai_response(prompt)