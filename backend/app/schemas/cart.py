from __future__ import annotations

from pydantic import BaseModel


class CartItemCreate(BaseModel):
    subvariant_id: int
    quantity: int = 1


class CartItemUpdate(BaseModel):
    quantity: int


class CartItemResponse(BaseModel):
    id: int
    subvariant_id: int
    quantity: int
    subvariant_name: str
    variant_name: str
    variant_sku: str
    attributes: dict
    price: float
    image_url: str | None
    stock: int


class CartResponse(BaseModel):
    id: int
    items: list[CartItemResponse]
    total: float
