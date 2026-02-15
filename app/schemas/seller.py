from pydantic import BaseModel, EmailStr, Field,validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal




class SellerCreate(BaseModel):
    shop_name: str
    shop_description: str
    payout_account: str



class SellerUpdate(BaseModel):
    shop_name: Optional[str]
    shop_description: Optional[str]
    payout_account: Optional[str]


class SellerProfileResponse(BaseModel):
    id: int
    shop_name: str
    shop_description: str
    payout_account: str
    verification_status: str
    created_at: datetime
