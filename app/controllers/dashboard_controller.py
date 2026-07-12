from app.services.dashboard_service import dashboard_stats


async def get_dashboard():
    return await dashboard_stats()