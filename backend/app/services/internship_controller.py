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

    # Generate recommendation using Gemini
    recommendation = await generate_internship_recommendation(data)

    # Convert BSON to JSON-safe format
    recommendation = json.loads(json_util.dumps(recommendation))

    # Convert request object to dictionary
    try:
        request_data = data.model_dump()      # Pydantic v2
    except AttributeError:
        request_data = data.dict()            # Pydantic v1

    # Save both request and recommendation
    internship_id = save_internship(
        request_data,
        recommendation
    )

    return {
        "internship_id": internship_id,
        "recommendation": recommendation,
    }