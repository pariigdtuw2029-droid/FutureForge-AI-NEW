from app.services.analytics_service import get_recent_activity


async def recent_activity():
    return await get_recent_activity()