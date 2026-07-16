import json
from bson import json_util

from app.schemas import ResumeRequest
from app.services.resume_ai_service import analyze_resume
from app.services.resume_service import save_resume_analysis


async def analyze_resume_controller(data: ResumeRequest):
    """
    Generate an AI-powered resume analysis.
    """

    # Generate analysis using Gemini
    analysis = await analyze_resume(data)

    # Convert BSON to JSON-safe format
    analysis = json.loads(json_util.dumps(analysis))

    # Convert request object to dictionary
    try:
        request_data = data.model_dump()   # Pydantic v2
    except AttributeError:
        request_data = data.dict()         # Pydantic v1

    # Save request and analysis in MongoDB
    resume_id = save_resume_analysis(
        request_data,
        analysis
    )

    return {
        "resume_id": resume_id,
        "analysis": analysis,
    }