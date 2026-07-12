from app.database.mongodb import project_collection


async def save_project(data: dict):
    # TEMPORARY: Don't save to MongoDB
    return "test-project-id"


async def get_all_projects():
    projects = []

    async for project in project_collection.find():
        project["_id"] = str(project["_id"])
        projects.append(project)

    return projects