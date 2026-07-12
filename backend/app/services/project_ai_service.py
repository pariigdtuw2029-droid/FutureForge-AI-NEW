import json

from app.prompts.project_prompt import PROJECT_PROMPT
from app.ai.gemini import ask_gemini


async def generate_project(request):
    prompt = PROJECT_PROMPT.format(
        skills=request.skills,
        interests=request.interests,
        career_goal=request.career_goal,
        preferred_domain=request.preferred_domain,
        experience_level=request.experience_level,
    )

    response = ask_gemini(prompt)

    try:
        return json.loads(response)
    except json.JSONDecodeError:
        return {
            "error": "Gemini returned invalid JSON",
            "raw_response": response,
        }