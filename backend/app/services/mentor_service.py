import json
import logging

from app.database import db
from app.ai.gemini import ask_gemini

logger = logging.getLogger("futureforge")


def generate_mentor_report(user_email: str):
    """
    Generate an AI mentor report for the given user.
    """

    # -----------------------------
    # Get Memory
    # -----------------------------
    memory = db.memory.find_one(
        {"user_email": user_email},
        {"_id": 0}
    )

    if not memory:
        raise Exception("Memory not found")

    # -----------------------------
    # Get Career Progress
    # -----------------------------
    progress = db.career_progress.find_one(
        {"user_email": user_email},
        {"_id": 0}
    )

    if not progress:
        raise Exception("Career progress not found")

    # -----------------------------
    # Build Prompt
    # -----------------------------
    prompt = f"""
You are an expert AI Career Mentor.

Analyze the student's profile below.

Skills:
{memory["skills"]}

Goals:
{memory["goals"]}

Projects:
{memory["projects"]}

Resume Score:
{memory["resume_score"]}

Current Role:
{progress["current_role"]}

Target Role:
{progress["target_role"]}

Career Progress:
{progress["progress_percentage"]}%

Interview Score:
70

IMPORTANT:
Return ONLY valid JSON.

Do not write markdown.
Do not write explanations.
Do not use ```json.

Return exactly in this format:

{{
  "career_health": 85,
  "strengths": [
    "Python",
    "FastAPI"
  ],
  "weaknesses": [
    "DSA"
  ],
  "recommendations": [
    "Practice Graphs",
    "Build Backend Projects",
    "Take Mock Interviews"
  ]
}}
"""

    # -----------------------------
    # Ask Gemini
    # -----------------------------
    response = ask_gemini(prompt)

    logger.debug("Gemini mentor report raw response: %s", response)

    if not response:
        raise Exception("Gemini returned an empty response.")

    # Remove markdown if Gemini returns it
    response = response.strip()

    if response.startswith("```json"):
        response = response.replace("```json", "", 1)

    if response.startswith("```"):
        response = response.replace("```", "", 1)

    if response.endswith("```"):
        response = response[:-3]

    response = response.strip()

    try:
        return json.loads(response)

    except json.JSONDecodeError:
        raise Exception(
            f"Gemini returned invalid JSON:\n\n{response}"
        )