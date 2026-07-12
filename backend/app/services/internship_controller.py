import json
from bson import json_util

from app.schemas import InternshipRequest
from app.services.internship_ai_service import (
    generate_internship_recommendation,
)
from app.services.internship_service import save_internship


async def recommend_internship(data: InternshipRequest):
    """
    Generate an AI-powered internship recommendation.
    """

    recommendation = await generate_internship_recommendation(data)

    recommendation = json.loads(json_util.dumps(recommendation))

    internship_id = await save_internship(recommendation)

    return {
        "internship_id": internship_id,
        "recommendation": recommendation,
    }