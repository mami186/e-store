from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class AddressCreate(BaseModel):
    full_name: str
    phone: str
    street: str
    city: str
    state: str | None = None
    postal_code: str
    country: str = "US"


class AddressUpdate(BaseModel):
    full_name: str | None = None
    phone: str | None = None
    street: str | None = None
    city: str | None = None
    state: str | None = None
    postal_code: str | None = None
    country: str | None = None


class AddressResponse(BaseModel):
    id: int
    full_name: str
    phone: str
    street: str
    city: str
    state: str | None
    postal_code: str
    country: str
    is_default: bool

    model_config = {"from_attributes": True}


class OrderItemResponse(BaseModel):
    id: int
    variant_id: int
    product_name: str
    variant_name: str
    variant_sku: str
    size: str | None
    color: str | None
    quantity: int
    unit_price: float
    total_price: float

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: int
    status: str
    payment_status: str
    subtotal: float
    shipping_cost: float
    total: float
    items: list[OrderItemResponse]
    address: AddressResponse
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CreateOrderRequest(BaseModel):
    address_id: int
    notes: str | None = None
