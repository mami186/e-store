# """
# Product Router

# Public and authenticated user endpoints for products:
# - GET /products - List all active products (public)
# - GET /products/{product_id} - Get product details (public)
# - GET /products/user/{user_id} - Get user's products (if seller)
# - POST /products/{product_id}/comments - Add comment (authenticated users)
# """

# from typing import List
# from fastapi import APIRouter, Depends, HTTPException, status, Query
# from sqlalchemy.orm import Session

# from app.db.database import get_db
# from app.schemas.pydantic_schemas import ProductResponse, ProductListResponse, CommentCreate, CommentResponse
# from app.models.models import Product, ProductComment, User
# from app.utils.auth import get_current_active_user

# router = APIRouter(prefix="/products", tags=["Products"])


# @router.get("", response_model=List[ProductResponse])
# def list_active_products(
#     db: Session = Depends(get_db),
#     skip: int = Query(0, ge=0),
#     limit: int = Query(20, ge=1, le=100),
#     status: str = Query("active", description="Filter by status")
# ):
#     """
#     List all active, non-delisted products (public endpoint)
    
#     Query parameters:
#     - **skip**: Number of products to skip (pagination)
#     - **limit**: Maximum number of products to return (max 100)
#     - **status**: Filter by status (default: "active")
    
#     Returns list of products that are:
#     - status = "active" (or specified status)
#     - is_active = True
#     - delisted = False
    
#     No authentication required
#     """
#     products = db.query(Product).filter(
#         Product.status == status,
#         Product.is_active == True,
#         Product.delisted == False
#     ).offset(skip).limit(limit).all()
    
#     return products


# @router.get("/{product_id}", response_model=ProductResponse)
# def get_product_details(
#     product_id: int,
#     db: Session = Depends(get_db)
# ):
#     """
#     Get detailed information about a specific product (public endpoint)
    
#     Returns product details if product is active and not delisted
    
#     No authentication required
#     """
#     product = db.query(Product).filter(
#         Product.id == product_id,
#         Product.is_active == True,
#         Product.delisted == False
#     ).first()
    
#     if not product:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Product not found or not available"
#         )
    
#     return product


# @router.get("/user/{user_id}", response_model=List[ProductResponse])
# def get_user_products(
#     user_id: int,
#     db: Session = Depends(get_db),
#     skip: int = Query(0, ge=0),
#     limit: int = Query(20, ge=1, le=100)
# ):
#     """
#     Get products by a specific user (if they are a seller)
    
#     Query parameters:
#     - **skip**: Number of products to skip (pagination)
#     - **limit**: Maximum number of products to return
    
#     Returns active, non-delisted products from the specified seller
    
#     No authentication required
#     """
#     products = db.query(Product).filter(
#         Product.seller_id == user_id,
#         Product.is_active == True,
#         Product.delisted == False,
#         Product.status == "active"
#     ).offset(skip).limit(limit).all()
    
#     return products


# @router.post("/{product_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
# def add_product_comment(
#     product_id: int,
#     comment: CommentCreate,
#     current_user: User = Depends(get_current_active_user),
#     db: Session = Depends(get_db)
# ):
#     """
#     Add a comment/review to a product
    
#     Required fields:
#     - **content**: Comment text (max 2000 chars)
#     - **rating**: Product rating 1-5 (optional)
#     - **parent_comment_id**: ID of parent comment if this is a reply (optional)
    
#     Returns created comment with status "pending" (requires moderator approval)
    
#     Requires: Valid JWT token (any authenticated user)
#     """
#     # Verify product exists
#     product = db.query(Product).filter(Product.id == product_id).first()
#     if not product:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Product not found"
#         )
    
#     # Create comment
#     db_comment = ProductComment(
#         product_id=product_id,
#         user_id=current_user.id,
#         content=comment.content,
#         rating=comment.rating,
#         parent_comment_id=comment.parent_comment_id,
#         referenced_reply_id=comment.referenced_reply_id,
#         status="pending"  # Requires moderator approval
#     )
#     db.add(db_comment)
#     db.commit()
#     db.refresh(db_comment)
    
#     return db_comment


# @router.get("/{product_id}/comments", response_model=List[CommentResponse])
# def get_product_comments(
#     product_id: int,
#     db: Session = Depends(get_db),
#     skip: int = Query(0, ge=0),
#     limit: int = Query(50, ge=1, le=100)
# ):
#     """
#     Get approved comments for a product (public endpoint)
    
#     Query parameters:
#     - **skip**: Number of comments to skip (pagination)
#     - **limit**: Maximum number of comments to return
    
#     Returns list of approved comments only
    
#     No authentication required
#     """
#     comments = db.query(ProductComment).filter(
#         ProductComment.product_id == product_id,
#         ProductComment.status == "approved"
#     ).offset(skip).limit(limit).all()
    
#     return comments
