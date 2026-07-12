from fastapi import HTTPException

from app.database.mongodb import database
from app.schemas.auth_schema import RegisterSchema, LoginSchema
from app.utils.password import hash_password, verify_password
from app.core.security import create_access_token

async def register_user(user: RegisterSchema):

    existing = await database.users.find_one(
        {"email": user.email}
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    new_user = user.model_dump()

    new_user["password"] = hash_password(user.password)

    await database.users.insert_one(new_user)

    return {
        "message": "User registered successfully"
    }


async def login_user(user: LoginSchema):

    db_user = await database.users.find_one(
        {"email": user.email}
    )

    if not db_user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if not verify_password(
        user.password,
        db_user["password"]
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid password"
        )

    token = create_access_token(
        {
            "sub": db_user["email"]
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }