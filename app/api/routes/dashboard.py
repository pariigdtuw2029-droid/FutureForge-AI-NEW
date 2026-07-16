from fastapi import APIRouter

from app.controllers.dashboard_controller import get_dashboard

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get("/stats")
async def dashboard():
    return await get_dashboard()