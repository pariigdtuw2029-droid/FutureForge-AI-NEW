from datetime import datetime

from app.database import internship_collection


async def save_internship(request: dict, recommendation: dict):
    document = {
        "request": request,
        "recommendation": recommendation,
        "created_at": datetime.utcnow().isoformat()
    }

    result = await internship_collection.insert_one(document)

    return str(result.inserted_id)


async def get_all_internships():
    internships = []

    async for internship in internship_collection.find():
        internship["_id"] = str(internship["_id"])
        internships.append(internship)

    return internships