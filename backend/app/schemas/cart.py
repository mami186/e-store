from __future__ import annotations

from pydantic import BaseModel


class CartItemCreate(BaseModel):
    variant_id: int
    quantity: int = 1


class CartItemUpdate(BaseModel):
    quantity: int


class CartItemResponse(BaseModel):
    id: int
    variant_id: int
    quantity: int
    variant_name: str
    variant_sku: str
    size: str | None
    color: str | None
    price: float
    image_url: str | None
    stock: int


class CartResponse(BaseModel):
    id: int
    items: list[CartItemResponse]
    total: float
