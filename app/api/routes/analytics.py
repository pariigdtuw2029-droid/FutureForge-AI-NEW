from fastapi import APIRouter

from app.controllers.analytics_controller import recent_activity

router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
)


@router.get("/recent")
async def recent():
    return await recent_activity()