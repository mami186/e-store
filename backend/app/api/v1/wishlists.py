from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.exceptions import ConflictException, NotFoundException
from app.models.product import ProductVariant
from app.models.user import User
from app.models.wishlist import Wishlist, WishlistItem
from app.schemas.wishlist import WishlistItemCreate, WishlistItemResponse, WishlistResponse
from app.api.deps import get_current_active_user

router = APIRouter(prefix="/wishlist", tags=["wishlist"])


def build_wishlist_response(wishlist: Wishlist) -> WishlistResponse:
    items = []
    for item in wishlist.items:
        v = item.variant
        items.append(
            WishlistItemResponse(
                id=item.id,
                variant_id=item.variant_id,
                variant_name=v.variant_name if v else "",
                variant_sku=v.sku if v else "",
                size=v.size if v else None,
                color=v.color if v else None,
                price=float(v.price) if v else 0,
                image_url=v.image_url if v else None,
                added_at=item.added_at,
            )
        )
    return WishlistResponse(id=wishlist.id, items=items)


async def get_or_create_wishlist(user: User, db: AsyncSession) -> Wishlist:
    result = await db.execute(
        select(Wishlist)
        .where(Wishlist.user_id == user.id)
        .options(
            selectinload(Wishlist.items)
            .selectinload(WishlistItem.variant)
            .selectinload(ProductVariant.images),
        )
    )
    wishlist = result.scalar_one_or_none()
    if not wishlist:
        wishlist = Wishlist(user_id=user.id)
        db.add(wishlist)
        await db.commit()
        await db.refresh(wishlist)
    return wishlist


@router.get("", response_model=WishlistResponse)
async def get_wishlist(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    wishlist = await get_or_create_wishlist(current_user, db)
    return build_wishlist_response(wishlist)


@router.post("", response_model=WishlistResponse, status_code=201)
async def add_to_wishlist(
    data: WishlistItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    wishlist = await get_or_create_wishlist(current_user, db)

    result = await db.execute(select(ProductVariant).where(ProductVariant.id == data.variant_id))
    if not result.scalar_one_or_none():
        raise NotFoundException("Variant not found")

    result = await db.execute(
        select(WishlistItem).where(
            WishlistItem.wishlist_id == wishlist.id,
            WishlistItem.variant_id == data.variant_id,
        )
    )
    if result.scalar_one_or_none():
        raise ConflictException("Item already in wishlist")

    item = WishlistItem(wishlist_id=wishlist.id, variant_id=data.variant_id)
    db.add(item)
    await db.commit()
    wishlist = await get_or_create_wishlist(current_user, db)
    return build_wishlist_response(wishlist)


@router.delete("/items/{item_id}", response_model=WishlistResponse)
async def remove_from_wishlist(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    wishlist = await get_or_create_wishlist(current_user, db)
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
    wishlist = await get_or_create_wishlist(current_user, db)
    return build_wishlist_response(wishlist)
