from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

from app.database import users_collection
from app.dependencies import get_current_user
from app.models import create_user_document
from app.schemas import UserCreate
from app.utils.hash import hash_password, verify_password
from app.utils.jwt import create_access_token


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post(
    "/signup",
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
    description="Creates a new user account."
)
def signup(user: UserCreate) -> dict:

    existing_user = users_collection.find_one(
        {"email": user.email}
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already exists"
        )

    hashed_password = hash_password(user.password)

    new_user = create_user_document(
        user.name,
        user.email,
        hashed_password
    )

    users_collection.insert_one(new_user)

    return {
        "message": "User registered successfully"
    }


@router.post(
    "/login",
    summary="Login user",
    description="Authenticates the user and returns a JWT token."
)
def login(
    form_data: OAuth2PasswordRequestForm = Depends()
) -> dict:

    existing_user = users_collection.find_one(
        {"email": form_data.username}
    )

    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not verify_password(
        form_data.password,
        existing_user["password"]
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    token = create_access_token(
        {"email": existing_user["email"]}
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }


@router.get(
    "/profile",
    summary="Get user profile",
    description="Returns the profile of the logged-in user."
)
def profile(
    current_user: dict = Depends(get_current_user)
) -> dict:

    user = users_collection.find_one(
        {"email": current_user["email"]}
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return {
        "name": user["name"],
        "email": user["email"],
        "created_at": user["created_at"]
    }