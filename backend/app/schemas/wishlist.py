from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class WishlistItemCreate(BaseModel):
    variant_id: int


class WishlistItemResponse(BaseModel):
    id: int
    variant_id: int
    variant_name: str
    variant_sku: str
    size: str | None
    color: str | None
    price: float
    image_url: str | None
    added_at: datetime


class WishlistResponse(BaseModel):
    id: int
    items: list[WishlistItemResponse]
