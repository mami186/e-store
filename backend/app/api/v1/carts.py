from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.exceptions import ConflictException, NotFoundException
from app.models.cart import Cart, CartItem
from app.models.product import ProductSubVariant
from app.models.user import User
from app.schemas.cart import CartItemCreate, CartItemUpdate, CartItemResponse, CartResponse
from app.api.deps import get_current_active_user

router = APIRouter(prefix="/cart", tags=["cart"])


def build_cart_response(cart: Cart) -> CartResponse:
    items = []
    for item in cart.items:
        sv = item.subvariant
        items.append(
            CartItemResponse(
                id=item.id,
                subvariant_id=item.subvariant_id,
                quantity=item.quantity,
                subvariant_name=sv.subvariant_name if sv else "",
                variant_name=sv.variant.variant_name if sv and sv.variant else "",
                variant_sku=sv.sku if sv else "",
                attributes=sv.attributes if sv else {},
                price=float(sv.effective_price) if sv else 0,
                image_url=sv.image_url if sv else None,
                stock=sv.stock if sv else 0,
            )
        )
    total = sum(
        float(item.subvariant.effective_price) * item.quantity
        for item in cart.items if item.subvariant
    )
    return CartResponse(id=cart.id, items=items, total=total)


async def get_or_create_cart(user_id: int, db: AsyncSession) -> Cart:
    result = await db.execute(
        select(Cart)
        .where(Cart.user_id == user_id)
        .options(
            selectinload(Cart.items)
            .selectinload(CartItem.subvariant)
            .selectinload(ProductSubVariant.variant),
        )
    )
    cart = result.scalar_one_or_none()
    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        await db.flush()
        cart_id = cart.id
        await db.commit()
        result = await db.execute(
            select(Cart)
            .where(Cart.id == cart_id)
            .options(
                selectinload(Cart.items)
                .selectinload(CartItem.subvariant)
                .selectinload(ProductSubVariant.variant),
            )
        )
        cart = result.scalar_one()
    return cart


@router.get("", response_model=CartResponse)
async def get_cart(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    cart = await get_or_create_cart(current_user.id, db)
    return build_cart_response(cart)


@router.post("", response_model=CartResponse, status_code=201)
async def add_to_cart(
    data: CartItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    cart = await get_or_create_cart(current_user.id, db)

    result = await db.execute(
        select(ProductSubVariant).where(ProductSubVariant.id == data.subvariant_id)
    )
    if not result.scalar_one_or_none():
        raise NotFoundException("SubVariant not found")

    result = await db.execute(
        select(CartItem).where(
            CartItem.cart_id == cart.id, CartItem.subvariant_id == data.subvariant_id
        )
    )
    existing = result.scalar_one_or_none()
    if existing:
        existing.quantity += data.quantity
    else:
        item = CartItem(cart_id=cart.id, subvariant_id=data.subvariant_id, quantity=data.quantity)
        db.add(item)

    await db.commit()
    cart = await get_or_create_cart(current_user.id, db)
    return build_cart_response(cart)


@router.put("/items/{item_id}", response_model=CartResponse)
async def update_cart_item(
    item_id: int,
    data: CartItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    cart = await get_or_create_cart(current_user.id, db)
    result = await db.execute(
        select(CartItem).where(CartItem.id == item_id, CartItem.cart_id == cart.id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise NotFoundException("Cart item not found")

    if data.quantity < 1:
        await db.delete(item)
    else:
        item.quantity = data.quantity
    await db.commit()
    cart = await get_or_create_cart(current_user.id, db)
    return build_cart_response(cart)


@router.delete("/items/{item_id}", response_model=CartResponse)
async def remove_from_cart(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    cart = await get_or_create_cart(current_user.id, db)
    result = await db.execute(
        select(CartItem).where(CartItem.id == item_id, CartItem.cart_id == cart.id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise NotFoundException("Cart item not found")
    await db.delete(item)
    await db.commit()
    cart = await get_or_create_cart(current_user.id, db)
    return build_cart_response(cart)


@router.delete("", response_model=CartResponse)
async def clear_cart(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    cart = await get_or_create_cart(current_user.id, db)
    for item in cart.items:
        await db.delete(item)
    await db.commit()
    cart = await get_or_create_cart(current_user.id, db)
    return build_cart_response(cart)
