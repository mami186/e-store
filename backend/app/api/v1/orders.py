from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.exceptions import NotFoundException
from app.models.cart import Cart, CartItem
from app.models.order import Address, Order, OrderItem
from app.models.product import ProductSubVariant
from app.models.user import User
from app.schemas.order import (
    AddressCreate,
    AddressResponse,
    AddressUpdate,
    CreateOrderRequest,
    OrderResponse,
)
from app.api.deps import get_current_active_user

router = APIRouter(prefix="/orders", tags=["orders"])

# ─── Addresses ───────────────────────────────────────────────────────


@router.get("/addresses", response_model=list[AddressResponse])
async def list_addresses(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(Address).where(Address.user_id == current_user.id)
    )
    return result.scalars().all()


@router.post("/addresses", response_model=AddressResponse, status_code=201)
async def create_address(
    data: AddressCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    address = Address(user_id=current_user.id, **data.model_dump())
    db.add(address)
    await db.commit()
    await db.refresh(address)
    return address


@router.put("/addresses/{address_id}", response_model=AddressResponse)
async def update_address(
    address_id: int,
    data: AddressUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(Address).where(
            Address.id == address_id, Address.user_id == current_user.id
        )
    )
    address = result.scalar_one_or_none()
    if not address:
        raise NotFoundException("Address not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(address, field, value)
    await db.commit()
    await db.refresh(address)
    return address


@router.delete("/addresses/{address_id}", status_code=204)
async def delete_address(
    address_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(Address).where(
            Address.id == address_id, Address.user_id == current_user.id
        )
    )
    address = result.scalar_one_or_none()
    if not address:
        raise NotFoundException("Address not found")
    await db.delete(address)
    await db.commit()


# ─── Orders ──────────────────────────────────────────────────────────


@router.get("", response_model=list[OrderResponse])
async def list_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(Order)
        .where(Order.user_id == current_user.id)
        .options(
            selectinload(Order.items).selectinload(OrderItem.subvariant),
            selectinload(Order.address),
        )
        .order_by(Order.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id, Order.user_id == current_user.id)
        .options(
            selectinload(Order.items).selectinload(OrderItem.subvariant),
            selectinload(Order.address),
        )
    )
    order = result.scalar_one_or_none()
    if not order:
        raise NotFoundException("Order not found")
    return order


@router.post("", response_model=OrderResponse, status_code=201)
async def create_order(
    data: CreateOrderRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(Address).where(
            Address.id == data.address_id, Address.user_id == current_user.id
        )
    )
    address = result.scalar_one_or_none()
    if not address:
        raise NotFoundException("Address not found")

    result = await db.execute(
        select(Cart)
        .where(Cart.user_id == current_user.id)
        .options(
            selectinload(Cart.items)
            .selectinload(CartItem.subvariant)
            .selectinload(ProductSubVariant.variant),
        )
    )
    cart = result.scalar_one_or_none()
    if not cart or not cart.items:
        raise NotFoundException("Cart is empty")

    subtotal = 0.0
    order_items = []
    for cart_item in cart.items:
        sv = cart_item.subvariant
        if not sv or not sv.is_active or sv.stock < cart_item.quantity:
            raise NotFoundException(
                f"SubVariant '{sv.subvariant_name if sv else 'N/A'}' is out of stock"
            )
        unit_price = float(sv.effective_price)
        total_price = unit_price * cart_item.quantity
        subtotal += total_price

        order_items.append(
            OrderItem(
                subvariant_id=sv.id,
                product_name=sv.variant.product.name,
                variant_name=sv.variant.variant_name,
                subvariant_name=sv.subvariant_name,
                variant_sku=sv.sku,
                attributes=sv.attributes,
                quantity=cart_item.quantity,
                unit_price=unit_price,
                total_price=total_price,
            )
        )
        sv.stock -= cart_item.quantity

    shipping_cost = 0.0
    total = subtotal + shipping_cost

    order = Order(
        user_id=current_user.id,
        address_id=data.address_id,
        subtotal=subtotal,
        shipping_cost=shipping_cost,
        total=total,
        notes=data.notes,
    )
    db.add(order)
    await db.flush()
    order_id = order.id

    for item in order_items:
        item.order_id = order_id
        db.add(item)

    for cart_item in cart.items:
        await db.delete(cart_item)

    await db.commit()
    result = await db.execute(
        select(Order)
        .where(Order.id == order_id)
        .options(
            selectinload(Order.items).selectinload(OrderItem.subvariant),
            selectinload(Order.address),
        )
    )
    order = result.scalar_one()
    return order
