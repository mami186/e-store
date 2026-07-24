from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import ConflictException, NotFoundException, UnauthorizedException
from app.core.security import get_password_hash, verify_password
from app.models.user import User
from app.schemas.user import PasswordUpdate, UserResponse, UserUpdate
from app.api.deps import get_current_active_user

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_me(
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if data.username:
        result = await db.execute(select(User).where(User.username == data.username))
        if result.scalar_one_or_none():
            raise ConflictException("Username already taken")
        current_user.username = data.username
    if data.first_name is not None:
        current_user.first_name = data.first_name
    if data.last_name is not None:
        current_user.last_name = data.last_name
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.put("/me/password")
async def update_password(
    data: PasswordUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if not current_user.password_hash:
        raise UnauthorizedException("Cannot change password for OAuth accounts")
    if not verify_password(data.current_password, current_user.password_hash):
        raise UnauthorizedException("Current password is incorrect")
    current_user.password_hash = get_password_hash(data.new_password)
    await db.commit()
    return {"message": "Password updated"}
