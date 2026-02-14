# """
# Admin Router

# Endpoints for admin and moderator operations:

# Role Management (Super Admin & Admin only):
# - POST /admin/users/{user_id}/promote-admin - Promote user to admin (super admin only)
# - POST /admin/users/{user_id}/promote-moderator - Promote user to moderator (admin only)

# Moderation (Moderator, Admin & Super Admin):
# - PUT /admin/products/{product_id}/status - Change product status
# - PUT /admin/product-images/{image_id}/status - Change product image status
# - PUT /admin/sellers/{seller_id}/status - Change seller profile status
# - PUT /admin/comments/{comment_id}/status - Change comment status
# - PUT /admin/users/{user_id}/status - Activate/deactivate user

# Listing (Admin & Super Admin):
# - GET /admin/users - List all users
# - GET /admin/products - List all products (including drafts)
# - GET /admin/sellers - List all sellers

# User Management (Super Admin only):
# - DELETE /admin/users/{user_id} - Delete user
# """

# from typing import List
# from fastapi import APIRouter, Depends, HTTPException, status
# from sqlalchemy.orm import Session

# from app.db.database import get_db
# from app.schemas.pydantic_schemas import (
#     UserListResponse,
#     UserStatusUpdate,
#     StatusUpdate,
#     BooleanStatusUpdate,
#     RoleUpdate,
#     ProductResponse,
#     SellerProfileResponse
# )
# from app.models.models import User, Product, ProductImage, SellerProfile, ProductComment
# from app.services.user_crud import assign_role_to_user, update_user_status, delete_user, get_users
# from app.utils.auth import get_current_active_user
# from app.utils.permissions import (
#     require_moderator,
#     require_admin,
#     require_super_admin,
#     validate_role_promotion,
#     MODERATOR,
#     ADMIN
# )

# router = APIRouter(prefix="/admin", tags=["Admin"])


# # ============================================================================
# # Role Management
# # ============================================================================

# @router.post("/users/{user_id}/promote-admin", response_model=UserListResponse)
# def promote_user_to_admin(
#     user_id: int,
#     current_user: User = Depends(get_current_active_user),
#     db: Session = Depends(get_db)
# ):
#     """
#     Promote user to ADMIN role (role_id=3)
    
#     Only SUPER ADMIN can promote users to admin
    
#     Requires: SUPER ADMIN role
#     """
#     require_super_admin(current_user)
#     validate_role_promotion(current_user, ADMIN)
    
#     return assign_role_to_user(db, user_id, ADMIN, current_user.id)


# @router.post("/users/{user_id}/promote-moderator", response_model=UserListResponse)
# def promote_user_to_moderator(
#     user_id: int,
#     current_user: User = Depends(get_current_active_user),
#     db: Session = Depends(get_db)
# ):
#     """
#     Promote user to MODERATOR role (role_id=2)
    
#     Only ADMIN or higher can promote users to moderator
    
#     Requires: ADMIN role or higher
#     """
#     require_admin(current_user)
#     validate_role_promotion(current_user, MODERATOR)
    
#     return assign_role_to_user(db, user_id, MODERATOR, current_user.id)


# # ============================================================================
# # Moderation - Status Changes
# # ============================================================================

# @router.put("/products/{product_id}/status", response_model=ProductResponse)
# def change_product_status(
#     product_id: int,
#     status_update: StatusUpdate,
#     current_user: User = Depends(get_current_active_user),
#     db: Session = Depends(get_db)
# ):
#     """
#     Change product status (draft, active, inactive)
    
#     Moderators can approve/reject products by changing their status
    
#     Requires: MODERATOR role or higher
#     """
#     require_moderator(current_user)
    
#     product = db.query(Product).filter(Product.id == product_id).first()
#     if not product:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Product not found"
#         )
    
#     product.status = status_update.status
#     db.commit()
#     db.refresh(product)
    
#     return product


# @router.put("/product-images/{image_id}/status", response_model=dict)
# def change_product_image_status(
#     image_id: int,
#     status_update: BooleanStatusUpdate,
#     current_user: User = Depends(get_current_active_user),
#     db: Session = Depends(get_db)
# ):
#     """
#     Change product image status (active/inactive)
    
#     Moderators can approve/reject product images
    
#     Requires: MODERATOR role or higher
#     """
#     require_moderator(current_user)
    
#     image = db.query(ProductImage).filter(ProductImage.id == image_id).first()
#     if not image:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Product image not found"
#         )
    
#     image.status = status_update.status
#     db.commit()
    
#     return {"message": "Product image status updated", "image_id": image_id, "status": status_update.status}


# @router.put("/sellers/{seller_id}/status", response_model=SellerProfileResponse)
# def change_seller_status(
#     seller_id: int,
#     status_update: StatusUpdate,
#     current_user: User = Depends(get_current_active_user),
#     db: Session = Depends(get_db)
# ):
#     """
#     Change seller profile verification status (pending, approved, rejected)
    
#     Moderators can approve/reject seller applications
    
#     Requires: MODERATOR role or higher
#     """
#     require_moderator(current_user)
    
#     seller = db.query(SellerProfile).filter(SellerProfile.user_id == seller_id).first()
#     if not seller:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Seller profile not found"
#         )
    
#     seller.verification_status = status_update.status
#     db.commit()
#     db.refresh(seller)
    
#     return seller


# @router.put("/comments/{comment_id}/status", response_model=dict)
# def change_comment_status(
#     comment_id: int,
#     status_update: StatusUpdate,
#     current_user: User = Depends(get_current_active_user),
#     db: Session = Depends(get_db)
# ):
#     """
#     Change comment status (pending, approved, rejected)
    
#     Moderators can approve/reject comments
    
#     Requires: MODERATOR role or higher
#     """
#     require_moderator(current_user)
    
#     comment = db.query(ProductComment).filter(ProductComment.id == comment_id).first()
#     if not comment:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Comment not found"
#         )
    
#     comment.status = status_update.status
#     db.commit()
    
#     return {"message": "Comment status updated", "comment_id": comment_id, "status": status_update.status}


# @router.put("/users/{user_id}/status", response_model=UserListResponse)
# def change_user_status(
#     user_id: int,
#     status_update: UserStatusUpdate,
#     current_user: User = Depends(get_current_active_user),
#     db: Session = Depends(get_db)
# ):
#     """
#     Activate or deactivate user account
    
#     Moderators can activate/deactivate user accounts
    
#     Requires: MODERATOR role or higher
#     """
#     require_moderator(current_user)
    
#     return update_user_status(db, user_id, status_update.is_active)


# # ============================================================================
# # Listing - Admin Only
# # ============================================================================

# @router.get("/users", response_model=List[UserListResponse])
# def list_all_users(
#     current_user: User = Depends(get_current_active_user),
#     db: Session = Depends(get_db),
#     skip: int = 0,
#     limit: int = 100
# ):
#     """
#     List all users in the system
    
#     Query parameters:
#     - **skip**: Number of users to skip (pagination)
#     - **limit**: Maximum number of users to return
    
#     Returns list of all users with their roles and status
    
#     Requires: ADMIN role or higher
#     """
#     require_admin(current_user)
    
#     return get_users(db, skip, limit)


# @router.get("/products", response_model=List[ProductResponse])
# def list_all_products(
#     current_user: User = Depends(get_current_active_user),
#     db: Session = Depends(get_db),
#     skip: int = 0,
#     limit: int = 100
# ):
#     """
#     List all products including drafts and delisted
    
#     Query parameters:
#     - **skip**: Number of products to skip (pagination)
#     - **limit**: Maximum number of products to return
    
#     Returns list of all products regardless of status
    
#     Requires: ADMIN role or higher
#     """
#     require_admin(current_user)
    
#     products = db.query(Product).offset(skip).limit(limit).all()
#     return products


# @router.get("/sellers", response_model=List[SellerProfileResponse])
# def list_all_sellers(
#     current_user: User = Depends(get_current_active_user),
#     db: Session = Depends(get_db),
#     skip: int = 0,
#     limit: int = 100
# ):
#     """
#     List all seller profiles
    
#     Query parameters:
#     - **skip**: Number of sellers to skip (pagination)
#     - **limit**: Maximum number of sellers to return
    
#     Returns list of all seller profiles with verification status
    
#     Requires: ADMIN role or higher
#     """
#     require_admin(current_user)
    
#     sellers = db.query(SellerProfile).offset(skip).limit(limit).all()
#     return sellers


# # ============================================================================
# # User Management - Super Admin Only
# # ============================================================================

# @router.delete("/users/{user_id}", status_code=status.HTTP_200_OK)
# def delete_user_account(
#     user_id: int,
#     current_user: User = Depends(get_current_active_user),
#     db: Session = Depends(get_db)
# ):
#     """
#     Permanently delete a user account
    
#     This will delete the user and all associated data.
#     Use with caution!
    
#     Returns success message
    
#     Requires: SUPER ADMIN role
#     """
#     require_super_admin(current_user)
    
#     # Prevent self-deletion
#     if user_id == current_user.id:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Cannot delete your own account"
#         )
    
#     delete_user(db, user_id)
#     return {"message": "User successfully deleted", "user_id": user_id}
