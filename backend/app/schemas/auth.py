from uuid import UUID
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, EmailStr, Field


class UserRegister(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    last_name: str | None = Field(None, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    recovery_phrase: str = Field(min_length=3, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: int
    uuid: UUID
    name: str
    last_name: str | None = None
    email: EmailStr
    password_updated_at: datetime | None = None
    recovery_phrase_updated_at: datetime | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class ForgotPasswordValidate(BaseModel):
    email: EmailStr
    recovery_phrase: str = Field(min_length=3, max_length=128)


class ResetPassword(BaseModel):
    email: EmailStr
    recovery_token: str
    new_password: str = Field(min_length=6, max_length=128)


class UserProfileUpdate(BaseModel):
    name: str | None = Field(None, min_length=2, max_length=120)
    last_name: str | None = Field(None, max_length=120)
    email: EmailStr | None = None
    recovery_phrase: str | None = Field(None, min_length=3, max_length=128)
    password: str | None = Field(None, min_length=6, max_length=128)
