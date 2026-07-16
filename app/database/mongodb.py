from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

client = AsyncIOMotorClient(settings.MONGODB_URL)

database = client[settings.DATABASE_NAME]


def get_database():
    return database
user_collection=database["users"]
resume_collection = database["resumes"]
project_collection = database["projects"]

roadmap_collection = database["roadmaps"]