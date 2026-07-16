from pymongo import MongoClient

from app.core.config import settings


# Connect to MongoDB
client = MongoClient(settings.MONGODB_URL)

# Select Database
db = client[settings.DATABASE_NAME]


# Collections
users_collection = db["users"]
memory_collection = db["memory"]
internship_collection = db["internships"]
resume_collection = db["resume_analysis"]