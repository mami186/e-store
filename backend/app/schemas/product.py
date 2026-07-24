from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class ProductImageResponse(BaseModel):
    id: int
    url: str
    alt_text: str | None
    is_main: bool
    variant_id: int | None
    subvariant_id: int | None

    model_config = {"from_attributes": True}


class SubVariantResponse(BaseModel):
    id: int
    variant_id: int
    sku: str
    subvariant_name: str
    price: float | None
    stock: int
    attributes: dict
    is_default: bool
    is_active: bool
    effective_price: float
    image_url: str | None
    images: list[ProductImageResponse]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductVariantResponse(BaseModel):
    id: int
    product_id: int
    sku: str
    variant_name: str
    price: float
    compare_at_price: float | None
    stock: int
    attributes: dict
    is_default: bool
    is_active: bool
    subvariants: list[SubVariantResponse]
    discount_percent: float | None

    model_config = {"from_attributes": True}


class ProductResponse(BaseModel):
    id: int
    seller_id: int
    name: str
    description: str | None
    category: str | None
    status: str
    is_active: bool
    variants: list[ProductVariantResponse]
    images: list[ProductImageResponse]
    main_image: str | None
    min_price: float | None
    max_price: float | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductListItem(BaseModel):
    id: int
    name: str
    category: str | None
    status: str
    is_active: bool
    main_image: str | None
    min_price: float | None
    max_price: float | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ProductCreate(BaseModel):
    name: str
    description: str | None = None
    category: str | None = None


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    category: str | None = None
    status: str | None = None


class VariantCreate(BaseModel):
    sku: str
    variant_name: str
    price: float
    compare_at_price: float | None = None
    stock: int = 0
    attributes: dict = {}
    is_default: bool = False


class VariantUpdate(BaseModel):
    sku: str | None = None
    variant_name: str | None = None
    price: float | None = None
    compare_at_price: float | None = None
    stock: int | None = None
    attributes: dict | None = None
    is_default: bool | None = None
    is_active: bool | None = None


class SubVariantCreate(BaseModel):
    sku: str
    subvariant_name: str
    price: float | None = None
    stock: int = 0
    attributes: dict = {}
    is_default: bool = False


class SubVariantUpdate(BaseModel):
    sku: str | None = None
    subvariant_name: str | None = None
    price: float | None = None
    stock: int | None = None
    attributes: dict | None = None
    is_default: bool | None = None
    is_active: bool | None = None


class ReportCreate(BaseModel):
    reason_text: str


class ReportResponse(BaseModel):
    id: int
    product_id: int
    reason_text: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class CommentCreate(BaseModel):
    content: str
    rating: int | None = None
    parent_comment_id: int | None = None


class CommentResponse(BaseModel):
    id: int
    product_id: int
    user_id: int
    parent_comment_id: int | None
    rating: int | None
    content: str
    status: str
    created_at: datetime
    replies: list[CommentResponse]

    model_config = {"from_attributes": True}
