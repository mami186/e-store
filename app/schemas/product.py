from pydantic import BaseModel
from typing import Optional

class ProductCreate(BaseModel):
    name: str
    variant_name: str
    description: str
    price: float
    stock: int

class ProductResponse(BaseModel):
    id: int
    seller_id: int
    name: str
    variant_name: str
    description: str
    price: float
    stock: int

class ProductUpdate(BaseModel):
    seller_id: int
    name: str
    variant_name: str
    description: str
    price: float
    stock: int




class ProductVariantCreate(BaseModel):
    product_id: int
    variant_name: str
    price: int
    stock: int

class ProductVariantUpdate(BaseModel):
    product_id: int
    variant_name: str
    price: int
    stock: int

class ProductVariantResponse(BaseModel):
    id: int
    product_id: int
    variant_name: str
    price: int
    stock: int




class ProductImageCreate(BaseModel):
    product_id: int
    variant_id: Optional[int]
    url: str
    alt_text: Optional[str]
    is_main: Optional[bool]

class ProductImageUpdate(BaseModel):
    id: int
    product_id: Optional[int]
    variant_id: Optional[int]
    url: str
    alt_text: Optional[str]
    is_main: Optional[bool]

class ProductImageResponse(BaseModel):
    id: int
    product_id: int
    variant_id: Optional[int]
    alt_text: Optional[str]
    is_main: bool





class ProductCommentCreate(BaseModel):
    product_id: int
    parent_comment_id: int
    referenced_reply_id: int
    user_id: int
    content: str
    rating: int


class ProductCommentUpdate(BaseModel):
    id
    product_id: int
    parent_comment_id: int
    referenced_reply_id: int
    user_id: int
    content: str
    rating: int


class ProductCommentResponse(BaseModel):
    id: int
    product_id: int
    parent_comment_id: int
    referenced_reply_id: int
    user_id: int
    content: str
    rating: int
