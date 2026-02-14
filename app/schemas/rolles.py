from pydantic import BaseModel, EmailStr, Field,validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal



class UserCreate(BaseModel):
    user_id: int
    role_id:int
    assigned_by :int


