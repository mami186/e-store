from pydantic import BaseModel, EmailStr, Field,validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal




class UserCreate(BaseModel):
    first_name: str
    last_name:str
    username :str
    email: str
    password: str

class UserResponse(BaseModel):
    id: int
    first_name: str
    last_name:str
    username :str
    email: str

class UserUpdate(BaseModel):
    id: int
    first_name: Optional[str]
    last_name: Optional[str]
    password: Optional[str]