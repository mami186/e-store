from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, model_validator

from app.schemas.product import ProductListItem


class FeaturedVariantInfo(BaseModel):
    id: int
    name: str
    price: float
    image: str | None
    product_id: int
    product_name: str

    model_config = {"from_attributes": True}


class FeaturedItemResponse(BaseModel):
    id: int
    position: int
    start_date: datetime
    end_date: datetime
    is_active: bool
    product: ProductListItem | None = None
    variant: FeaturedVariantInfo | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class FeaturedItemCreate(BaseModel):
    product_id: int | None = None
    variant_id: int | None = None
    position: int | None = None
    start_date: datetime
    end_date: datetime

    @model_validator(mode="after")
    def validate_one_of(self):
        if self.product_id is None and self.variant_id is None:
            raise ValueError("Either product_id or variant_id must be provided")
        if self.product_id is not None and self.variant_id is not None:
            raise ValueError("Only one of product_id or variant_id should be provided")
        if self.start_date >= self.end_date:
            raise ValueError("start_date must be before end_date")
        return self


class FeaturedItemUpdate(BaseModel):
    position: int | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None

    @model_validator(mode="after")
    def validate_dates(self):
        if self.start_date and self.end_date and self.start_date >= self.end_date:
            raise ValueError("start_date must be before end_date")
        return self
