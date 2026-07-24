from datetime import datetime

from pydantic import BaseModel


class SellerApply(BaseModel):
    shop_name: str
    shop_description: str | None = None
    payout_account: str | None = None


class SellerUpdate(BaseModel):
    shop_name: str | None = None
    shop_description: str | None = None
    payout_account: str | None = None


class SellerResponse(BaseModel):
    user_id: int
    shop_name: str
    shop_description: str | None
    payout_account: str | None
    is_active: bool
    verification_status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
