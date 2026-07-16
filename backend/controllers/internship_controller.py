import json

from bson import json_util

from app.schemas import InternshipRequest
from app.services.internship_ai_service import (
    generate_internship_recommendation,
)
from app.services.internship_service import save_internship


async def recommend_internship(data: InternshipRequest):
    """
    Generate an AI-powered internship recommendation
    and return it to the client.
    """

    # Generate recommendation using Gemini
    recommendation = await generate_internship_recommendation(data)

    # Convert any MongoDB ObjectId into string (if present)
    recommendation = json.loads(json_util.dumps(recommendation))

    # Save recommendation (currently returns a dummy ID)
    internship_id = await save_internship(recommendation)

    # API Response
    return {
        "internship_id": internship_id,
        "recommendation": recommendation,
    }