from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, Field


class RatingCreate(BaseModel):
    rating: int = Field(ge=1, le=5)


class RatingResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    rating: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RatingStats(BaseModel):
    average: float
    total: int
    distribution: list[int]
