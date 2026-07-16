import json
from bson import json_util

from app.schemas.project_schema import ProjectRequest
from app.services.project_ai_service import generate_project
from app.services.project_service import save_project


async def generate_project_architecture(data: ProjectRequest):
    project = await generate_project(data)
    print("========== PROJECT ==========")
    print(project)
    print(type(project))
    print("=============================")

    # Convert any ObjectId inside project to string
    project = json.loads(json_util.dumps(project))

    project_id = await save_project(project)

    return {
        "project_id": project_id,
        "recommendation": project
    }