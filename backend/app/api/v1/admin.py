from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.exceptions import ConflictException, ForbiddenException, NotFoundException
from app.models.product import Product, ProductComment, ProductImage
from app.models.user import Role, Seller, User, UserRole
from app.schemas.product import CommentResponse, ProductListItem, ProductResponse
from app.schemas.seller import SellerResponse
from app.schemas.user import UserResponse
from app.api.deps import get_current_active_user, require_moderator, require_super_admin

router = APIRouter(prefix="/admin", tags=["admin"])


@router.get("/users", response_model=list[UserResponse])
async def admin_list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_moderator),
):
    result = await db.execute(select(User).offset(skip).limit(limit))
    return result.scalars().all()


@router.put("/users/{user_id}/role")
async def admin_set_user_role(
    user_id: int,
    role_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_moderator),
):
    if role_id > current_user.highest_role_id:
        raise ForbiddenException("Cannot assign a role higher than your own")

    target_result = await db.execute(select(User).where(User.id == user_id))
    target = target_result.scalar_one_or_none()
    if not target:
        raise NotFoundException("User not found")

    if target.highest_role_id >= current_user.highest_role_id:
        raise ForbiddenException("Cannot modify users with equal or higher role")

    role_result = await db.execute(select(Role).where(Role.id == role_id))
    if not role_result.scalar_one_or_none():
        raise NotFoundException("Role not found")

    result = await db.execute(
        select(UserRole).where(
            UserRole.user_id == user_id, UserRole.role_id == role_id
        )
    )
    if result.scalar_one_or_none():
        raise ConflictException("User already has this role")

    ur = UserRole(user_id=user_id, role_id=role_id, assigned_by=current_user.id)
    db.add(ur)
    await db.commit()
    return {"message": "Role assigned"}


@router.put("/users/{user_id}/status")
async def admin_toggle_user_status(
    user_id: int,
    is_active: bool,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_moderator),
):
    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise NotFoundException("User not found")
    if target.highest_role_id >= current_user.highest_role_id:
        raise ForbiddenException("Cannot modify users with equal or higher role")
    target.is_active = is_active
    await db.commit()
    return {"message": "User status updated"}


@router.delete("/users/{user_id}", status_code=204)
async def admin_delete_user(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    target = result.scalar_one_or_none()
    if not target:
        raise NotFoundException("User not found")
    await db.delete(target)
    await db.commit()


@router.get("/sellers", response_model=list[SellerResponse])
async def admin_list_sellers(
    verification_status: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_moderator),
):
    query = select(Seller)
    if verification_status:
        query = query.where(Seller.verification_status == verification_status)
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.put("/sellers/{user_id}/verify")
async def admin_verify_seller(
    user_id: int,
    status: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_moderator),
):
    if status not in ("approved", "rejected", "pending"):
        raise ConflictException("Invalid status. Use: approved, rejected, pending")

    result = await db.execute(select(Seller).where(Seller.user_id == user_id))
    seller = result.scalar_one_or_none()
    if not seller:
        raise NotFoundException("Seller not found")
    seller.verification_status = status

    if status == "approved":
        result = await db.execute(
            select(UserRole).where(
                UserRole.user_id == user_id, UserRole.role_id == 1
            )
        )
        if not result.scalar_one_or_none():
            db.add(UserRole(user_id=user_id, role_id=1, assigned_by=current_user.id))

    await db.commit()
    return {"message": f"Seller {status}"}


@router.get("/products", response_model=list[ProductListItem])
async def admin_list_products(
    status: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_moderator),
):
    query = select(Product)
    if status:
        query = query.where(Product.status == status)
    query = query.offset(skip).limit(limit).order_by(Product.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.put("/products/{product_id}/status")
async def admin_update_product_status(
    product_id: int,
    status: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_moderator),
):
    if status not in ("draft", "published", "archived"):
        raise ConflictException("Invalid status")
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise NotFoundException("Product not found")
    product.status = status
    await db.commit()
    return {"message": "Product status updated"}


@router.get("/comments", response_model=list[CommentResponse])
async def admin_list_comments(
    status: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_moderator),
):
    query = select(ProductComment)
    if status:
        query = query.where(ProductComment.status == status)
    query = query.offset(skip).limit(limit).order_by(ProductComment.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.put("/comments/{comment_id}/status")
async def admin_update_comment_status(
    comment_id: int,
    status: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_moderator),
):
    if status not in ("pending", "approved", "rejected"):
        raise ConflictException("Invalid status")
    result = await db.execute(
        select(ProductComment).where(ProductComment.id == comment_id)
    )
    comment = result.scalar_one_or_none()
    if not comment:
        raise NotFoundException("Comment not found")
    comment.status = status
    await db.commit()
    return {"message": "Comment status updated"}
