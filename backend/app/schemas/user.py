from datetime import datetime

from pydantic import BaseModel, EmailStr


class RoleResponse(BaseModel):
    id: int
    name: str
    description: str | None

    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    id: int
    email: str
    username: str | None
    first_name: str | None
    last_name: str | None
    email_verified: bool
    is_active: bool
    avatar_url: str | None
    roles: list[RoleResponse]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    username: str | None = None


class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str
