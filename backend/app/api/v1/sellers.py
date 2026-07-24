from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import ConflictException, ForbiddenException, NotFoundException
from app.models.user import Seller, User, UserRole
from app.schemas.seller import SellerApply, SellerResponse, SellerUpdate
from app.api.deps import get_current_active_user

router = APIRouter(prefix="/sellers", tags=["sellers"])


@router.post("/apply", response_model=SellerResponse, status_code=201)
async def apply_seller(
    data: SellerApply,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(Seller).where(Seller.user_id == current_user.id))
    if result.scalar_one_or_none():
        raise ConflictException("Already applied as a seller")

    seller = Seller(
        user_id=current_user.id,
        shop_name=data.shop_name,
        shop_description=data.shop_description,
        payout_account=data.payout_account,
    )
    db.add(seller)
    await db.commit()
    await db.refresh(seller)
    return seller


@router.get("/me", response_model=SellerResponse)
async def get_my_seller_profile(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(Seller).where(Seller.user_id == current_user.id))
    seller = result.scalar_one_or_none()
    if not seller:
        raise NotFoundException("Seller profile not found")
    return seller


@router.put("/me", response_model=SellerResponse)
async def update_my_seller_profile(
    data: SellerUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(Seller).where(Seller.user_id == current_user.id))
    seller = result.scalar_one_or_none()
    if not seller:
        raise NotFoundException("Seller profile not found")

    if data.shop_name is not None:
        seller.shop_name = data.shop_name
    if data.shop_description is not None:
        seller.shop_description = data.shop_description
    if data.payout_account is not None:
        seller.payout_account = data.payout_account
    await db.commit()
    await db.refresh(seller)
    return seller


@router.get("/{user_id}", response_model=SellerResponse)
async def get_seller(
    user_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Seller).where(Seller.user_id == user_id))
    seller = result.scalar_one_or_none()
    if not seller:
        raise NotFoundException("Seller not found")
    return seller
