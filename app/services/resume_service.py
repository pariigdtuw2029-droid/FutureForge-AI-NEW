from app.database.mongodb import resume_collection


async def save_resume(data: dict):
    result = await resume_collection.insert_one(data)
    return str(result.inserted_id)