from app.database.mongodb import (
    resume_collection,
    project_collection,
    internship_collection,
    roadmap_collection,
)


async def get_recent_activity():
    activities = []

    async for resume in resume_collection.find().sort("_id", -1).limit(5):
        activities.append({
            "type": "Resume Upload",
            "id": str(resume["_id"])
        })

    async for project in project_collection.find().sort("_id", -1).limit(5):
        activities.append({
            "type": "Project Recommendation",
            "id": str(project["_id"])
        })

    async for internship in internship_collection.find().sort("_id", -1).limit(5):
        activities.append({
            "type": "Internship Recommendation",
            "id": str(internship["_id"])
        })

    async for roadmap in roadmap_collection.find().sort("_id", -1).limit(5):
        activities.append({
            "type": "Roadmap Generated",
            "id": str(roadmap["_id"])
        })

    return activities