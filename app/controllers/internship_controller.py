from app.schemas.internship_schema import InternshipRequest
from app.services.internship_ai_service import (
    generate_internship_recommendation,
)
from app.services.internship_service import (
    save_internship,
)


async def recommend_internship(data: InternshipRequest):
    # Generate AI recommendation
    recommendation = await generate_internship_recommendation(data)

    # Save request + recommendation to MongoDB
    internship_id = await save_internship(
        request=data.model_dump(),
        recommendation=recommendation,
    )

    # Return response
    return {
        "internship_id": internship_id,
        "recommendation": recommendation,
    }