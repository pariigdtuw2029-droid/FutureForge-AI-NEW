from fastapi import APIRouter

from app.schemas.auth_schema import RegisterSchema, LoginSchema
from app.controllers.auth_controller import register_user, login_user

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post("/register")
async def register(user: RegisterSchema):
    return await register_user(user)


@router.post("/login")
async def login(user: LoginSchema):
    return await login_user(user)