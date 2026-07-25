from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.exceptions import ConflictException, NotFoundException
from app.models.product import ProductSubVariant
from app.models.user import User
from app.models.wishlist import Wishlist, WishlistItem
from app.schemas.wishlist import WishlistItemCreate, WishlistItemResponse, WishlistResponse
from app.api.deps import get_current_active_user

router = APIRouter(prefix="/wishlist", tags=["wishlist"])


async def get_or_create_wishlist(user_id: int, db: AsyncSession) -> Wishlist:
    result = await db.execute(
        select(Wishlist)
        .where(Wishlist.user_id == user_id)
        .options(
            selectinload(Wishlist.items)
            .selectinload(WishlistItem.subvariant)
            .selectinload(ProductSubVariant.variant),
        )
    )
    wishlist = result.scalar_one_or_none()
    if not wishlist:
        wishlist = Wishlist(user_id=user_id)
        db.add(wishlist)
        await db.flush()
        wishlist_id = wishlist.id
        await db.commit()
        result = await db.execute(
            select(Wishlist)
            .where(Wishlist.id == wishlist_id)
            .options(
                selectinload(Wishlist.items)
                .selectinload(WishlistItem.subvariant)
                .selectinload(ProductSubVariant.variant),
            )
        )
        wishlist = result.scalar_one()
    return wishlist


def build_wishlist_response(wishlist: Wishlist) -> WishlistResponse:
    items = []
    for item in wishlist.items:
        sv = item.subvariant
        items.append(
            WishlistItemResponse(
                id=item.id,
                subvariant_id=item.subvariant_id,
                subvariant_name=sv.subvariant_name if sv else "",
                variant_name=sv.variant.variant_name if sv and sv.variant else "",
                variant_sku=sv.sku if sv else "",
                attributes=sv.attributes if sv else {},
                price=float(sv.effective_price) if sv else 0,
                image_url=sv.image_url if sv else None,
                added_at=item.added_at,
            )
        )
    return WishlistResponse(id=wishlist.id, items=items)


@router.get("", response_model=WishlistResponse)
async def get_wishlist(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    wishlist = await get_or_create_wishlist(current_user.id, db)
    return build_wishlist_response(wishlist)


@router.post("", response_model=WishlistResponse, status_code=201)
async def add_to_wishlist(
    data: WishlistItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    wishlist = await get_or_create_wishlist(current_user.id, db)

    result = await db.execute(
        select(ProductSubVariant).where(ProductSubVariant.id == data.subvariant_id)
    )
    if not result.scalar_one_or_none():
        raise NotFoundException("SubVariant not found")

    result = await db.execute(
        select(WishlistItem).where(
            WishlistItem.wishlist_id == wishlist.id,
            WishlistItem.subvariant_id == data.subvariant_id,
        )
    )
    if result.scalar_one_or_none():
        raise ConflictException("Already in wishlist")

    item = WishlistItem(wishlist_id=wishlist.id, subvariant_id=data.subvariant_id)
    db.add(item)
    await db.commit()
    wishlist = await get_or_create_wishlist(current_user.id, db)
    return build_wishlist_response(wishlist)


@router.delete("/items/{item_id}", response_model=WishlistResponse)
async def remove_from_wishlist(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    wishlist = await get_or_create_wishlist(current_user.id, db)
    result = await db.execute(
        select(WishlistItem).where(
            WishlistItem.id == item_id, WishlistItem.wishlist_id == wishlist.id
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise NotFoundException("Wishlist item not found")
    await db.delete(item)
    await db.commit()
    wishlist = await get_or_create_wishlist(current_user.id, db)
    return build_wishlist_response(wishlist)
