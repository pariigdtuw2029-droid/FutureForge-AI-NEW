from pydantic import BaseModel, EmailStr, Field


class RegisterSchema(BaseModel):
    full_name: str = Field(..., min_length=3)
    email: EmailStr
    password: str = Field(..., min_length=6)


class LoginSchema(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    role: str