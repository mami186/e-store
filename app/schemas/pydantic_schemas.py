"""
Pydantic Schemas for Request/Response Validation

Organized by entity type: User, Seller, Product, Comment, Admin operations
"""

from pydantic import BaseModel, EmailStr, Field,validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal


# ============================================================================
# Authentication & Token Schemas
# ============================================================================

class Token(BaseModel):
    """JWT access token response"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """JWT token payload data"""
    username: Optional[str] = None


# ============================================================================
# User Schemas
# ============================================================================

class UserBase(BaseModel):
    """Base user schema with common fields"""
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)


class UserCreate(UserBase):
    """Schema for user registration"""
    password: str = Field(..., min_length=8, max_length=100)
    
    @validator('password')
    def password_strength(cls, v):
        """Validate password has minimum requirements"""
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        if not any(c.isalpha() for c in v):
            raise ValueError('Password must contain at least one letter')
        return 


class UserLogin(BaseModel):
    """Schema for user login"""
    username: str  # Can be username or email
    password: str


class UserUpdate(BaseModel):
    """Schema for updating user profile"""
    email: Optional[EmailStr] = None
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    password: Optional[str] = Field(None, min_length=8, max_length=100)
    
    @validator('password')
    def password_strength(cls, v):
        """Validate password has minimum requirements"""
        if v is None:
            return v
        if not any(c.isdigit() for c in v):
            raise ValueError('Password must contain at least one digit')
        if not any(c.isalpha() for c in v):
            raise ValueError('Password must contain at least one letter')
        return v


class RoleInfo(BaseModel):
    """Role information"""
    id: int
    name: str
    description: Optional[str]
    
    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    """Schema for user profile response"""
    id: int
    email: str
    username: str
    email_verified: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime
    roles: List[RoleInfo] = []
    
    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    """Schema for listing users (admin only)"""
    id: int
    email: str
    username: str
    is_active: bool
    created_at: datetime
    roles: List[RoleInfo] = []
    
    class Config:
        from_attributes = True


# ============================================================================
# Seller Schemas
# ============================================================================

class SellerApplicationCreate(BaseModel):
    """Schema for applying to become a seller"""
    shop_name: str = Field(..., min_length=3, max_length=100)
    shop_description: Optional[str] = Field(None, max_length=1000)
    payout_account: str = Field(..., min_length=5, max_length=100)


class SellerProfileUpdate(BaseModel):
    """Schema for updating seller profile"""
    shop_name: Optional[str] = Field(None, min_length=3, max_length=100)
    shop_description: Optional[str] = Field(None, max_length=1000)
    payout_account: Optional[str] = Field(None, min_length=5, max_length=100)


class SellerProfileResponse(BaseModel):
    """Schema for seller profile response"""
    user_id: int
    shop_name: str
    shop_description: Optional[str]
    is_active: bool
    payout_account: str
    verification_status: str
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# Product Schemas
# ============================================================================

class ProductCreate(BaseModel):
    """Schema for creating a product (seller only)"""
    name: str = Field(..., min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=5000)
    price: Decimal = Field(..., gt=0, decimal_places=2)
    stock: int = Field(default=0, ge=0)
    status: str = Field(default="draft")  # draft, active, inactive


class ProductUpdate(BaseModel):
    """Schema for updating a product"""
    name: Optional[str] = Field(None, min_length=3, max_length=200)
    description: Optional[str] = Field(None, max_length=5000)
    price: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    stock: Optional[int] = Field(None, ge=0)
    status: Optional[str] = None


class ProductResponse(BaseModel):
    """Schema for product response"""
    id: int
    seller_id: int
    name: str
    description: Optional[str]
    price: Decimal
    stock: int
    status: str
    is_active: bool
    delisted: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    """Schema for product list with pagination"""
    products: List[ProductResponse]
    total: int
    page: int
    page_size: int


# ============================================================================
# Comment Schemas
# ============================================================================

class CommentCreate(BaseModel):
    """Schema for creating a product comment"""
    product_id: int
    content: str = Field(..., min_length=1, max_length=2000)
    rating: Optional[int] = Field(None, ge=1, le=5)
    parent_comment_id: Optional[int] = None
    referenced_reply_id: Optional[int] = None


class CommentResponse(BaseModel):
    """Schema for comment response"""
    id: int
    product_id: int
    user_id: int
    parent_comment_id: Optional[int]
    referenced_reply_id: Optional[int]
    rating: Optional[int]
    content: str
    status: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# Admin/Moderator Schemas
# ============================================================================

class RoleUpdate(BaseModel):
    """Schema for updating user role (admin/super admin only)"""
    role_id: int = Field(..., ge=0, le=4)


class StatusUpdate(BaseModel):
    """Schema for updating status of various entities"""
    status: str


class BooleanStatusUpdate(BaseModel):
    """Schema for updating boolean status fields"""
    status: bool


class UserStatusUpdate(BaseModel):
    """Schema for updating user active status"""
    is_active: bool


class ProductImageResponse(BaseModel):
    """Schema for product image response"""
    id: int
    product_id: int
    variant_id: Optional[int]
    url: str
    alt_text: Optional[str]
    status: bool
    is_main: bool
    created_at: datetime
    
    class Config:
        from_attributes = True
