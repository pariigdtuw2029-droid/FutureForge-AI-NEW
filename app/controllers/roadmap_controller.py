from app.schemas.roadmap_schema import RoadmapRequest
from app.services.roadmap_ai_service import generate_roadmap
from app.services.roadmap_service import save_roadmap


async def generate_roadmap_controller(data: RoadmapRequest):
    # Generate roadmap using Gemini
    roadmap = await generate_roadmap(data)

    # Save request + roadmap to MongoDB
    roadmap_id = await save_roadmap(
        request=data.model_dump(),
        roadmap=roadmap,
    )

    # Return response
    return {
        "roadmap_id": roadmap_id,
        "roadmap": roadmap,
    }