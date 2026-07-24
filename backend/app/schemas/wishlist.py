from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class WishlistItemCreate(BaseModel):
    subvariant_id: int


class WishlistItemResponse(BaseModel):
    id: int
    subvariant_id: int
    subvariant_name: str
    variant_name: str
    variant_sku: str
    attributes: dict
    price: float
    image_url: str | None
    added_at: datetime


class WishlistResponse(BaseModel):
    id: int
    items: list[WishlistItemResponse]
