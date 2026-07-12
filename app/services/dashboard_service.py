from app.database.mongodb import (
    user_collection,
    resume_collection,
    project_collection,
    internship_collection,
    roadmap_collection,
)


async def dashboard_stats():
    return {
        "total_users": await user_collection.count_documents({}),
        "total_resumes": await resume_collection.count_documents({}),
        "total_projects": await project_collection.count_documents({}),
        "total_internships": await internship_collection.count_documents({}),
        "total_roadmaps": await roadmap_collection.count_documents({})
    }