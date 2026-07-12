from datetime import datetime

from app.database.mongodb import database

roadmap_collection = database["roadmaps"]


async def save_roadmap(request: dict, roadmap: dict):
    document = {
        "request": request,
        "roadmap": roadmap,
        "created_at": datetime.utcnow().isoformat()
    }

    result = await roadmap_collection.insert_one(document)

    return str(result.inserted_id)


async def get_all_roadmaps():
    roadmaps = []

    async for roadmap in roadmap_collection.find():
        roadmap["_id"] = str(roadmap["_id"])
        roadmaps.append(roadmap)

    return roadmaps