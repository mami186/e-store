from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.exceptions import ConflictException, ForbiddenException, NotFoundException
from app.models.product import Product, ProductComment, ProductImage, ProductSubVariant
from app.models.report import Report
from app.models.restriction import Appeal, Restriction, RestrictionProduct, RestrictionReason
from app.models.order import Order, OrderItem
from app.schemas.product import ReportResponse
from app.schemas.restriction import (
    AppealResponse,
    CreateRestrictionRequest,
    RestrictionReasonCreate,
    RestrictionReasonResponse,
    RestrictionResponse,
)
from app.models.user import Role, Seller, User, UserRole
from app.schemas.order import OrderResponse
from app.schemas.product import AdminProductImageResponse, CommentResponse, ProductListItem, ProductResponse
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
    query = select(Product).options(selectinload(Product.category))
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


# ─── Order Management ─────────────────────────────────────────────────


@router.get("/orders", response_model=list[OrderResponse])
async def admin_list_orders(
    status: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_moderator),
):
    query = select(Order).options(
        selectinload(Order.items), selectinload(Order.address)
    )
    if status:
        query = query.where(Order.status == status)
    query = query.offset(skip).limit(limit).order_by(Order.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.put("/orders/{order_id}/status")
async def admin_update_order_status(
    order_id: int,
    status: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_super_admin),
):
    result = await db.execute(
        select(Order).where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise NotFoundException("Order not found")
    order.status = status
    await db.commit()
    return {"message": f"Order status set to {status}"}


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


@router.get("/reports", response_model=list[ReportResponse])
async def admin_list_reports(
    status: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_moderator),
):
    query = select(Report)
    if status:
        query = query.where(Report.status == status)
    query = query.offset(skip).limit(limit).order_by(Report.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.put("/reports/{report_id}/status")
async def admin_update_report_status(
    report_id: int,
    status: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_moderator),
):
    if status not in ("pending", "reviewed", "dismissed"):
        raise ConflictException("Invalid status")
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise NotFoundException("Report not found")
    report.status = status
    await db.commit()
    return {"message": "Report status updated"}


# ─── Restriction Reasons ──────────────────────────────────────────────


@router.get("/restriction-reasons", response_model=list[RestrictionReasonResponse])
async def admin_list_reasons(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_moderator),
):
    result = await db.execute(select(RestrictionReason).order_by(RestrictionReason.id))
    return result.scalars().all()


@router.post("/restriction-reasons", response_model=RestrictionReasonResponse, status_code=201)
async def admin_create_reason(
    data: RestrictionReasonCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_moderator),
):
    reason = RestrictionReason(reason_text=data.reason_text)
    db.add(reason)
    await db.commit()
    await db.refresh(reason)
    return reason


# ─── Restrictions ─────────────────────────────────────────────────────


@router.post("/users/{user_id}/restrict", response_model=RestrictionResponse, status_code=201)
async def admin_restrict_user(
    user_id: int,
    data: CreateRestrictionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_moderator),
):
    target_result = await db.execute(select(User).where(User.id == user_id))
    target = target_result.scalar_one_or_none()
    if not target:
        raise NotFoundException("User not found")
    if target.highest_role_id >= current_user.highest_role_id:
        raise ForbiddenException("Cannot restrict users with equal or higher role")

    reason_result = await db.execute(
        select(RestrictionReason).where(RestrictionReason.id == data.reason_id)
    )
    if not reason_result.scalar_one_or_none():
        raise NotFoundException("Restriction reason not found")

    restriction = Restriction(
        user_id=user_id,
        restricted_by=current_user.id,
        report_id=data.report_id,
        reason_id=data.reason_id,
        description=data.description,
        penalty_days=data.penalty_days,
    )
    db.add(restriction)
    await db.flush()

    for sv_id in data.subvariant_ids:
        sv_result = await db.execute(
            select(ProductSubVariant).where(ProductSubVariant.id == sv_id)
        )
        sv = sv_result.scalar_one_or_none()
        if sv:
            rp = RestrictionProduct(
                restriction_id=restriction.id,
                subvariant_id=sv_id,
                version_snapshot={
                    "sku": sv.sku,
                    "subvariant_name": sv.subvariant_name,
                    "price": float(sv.effective_price) if sv.effective_price else None,
                    "stock": sv.stock,
                    "attributes": sv.attributes,
                    "variant_name": sv.variant.variant_name,
                },
            )
            db.add(rp)

    await db.commit()

    order_result = await db.execute(
        select(Order).where(
            Order.user_id == user_id,
            Order.status == "pending",
        )
    )
    for order in order_result.scalars().all():
        order.status = "cancelled"
        order.notes = (order.notes or "") + " | Cancelled due to account restriction"

    await db.commit()

    result = await db.execute(
        select(Restriction)
        .where(Restriction.id == restriction.id)
        .options(selectinload(Restriction.products))
    )
    restriction = result.scalar_one_or_none()
    return restriction


@router.put("/restrictions/{restriction_id}/lift")
async def admin_lift_restriction(
    restriction_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_moderator),
):
    result = await db.execute(select(Restriction).where(Restriction.id == restriction_id))
    restriction = result.scalar_one_or_none()
    if not restriction:
        raise NotFoundException("Restriction not found")
    restriction.status = "lifted"
    restriction.lifted_at = datetime.now(timezone.utc)
    await db.commit()
    return {"message": "Restriction lifted"}


@router.get("/restrictions", response_model=list[RestrictionResponse])
async def admin_list_restrictions(
    status: str | None = None,
    user_id: int | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_moderator),
):
    query = select(Restriction).options(selectinload(Restriction.products))
    if status:
        query = query.where(Restriction.status == status)
    if user_id:
        query = query.where(Restriction.user_id == user_id)
    query = query.offset(skip).limit(limit).order_by(Restriction.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/appeals/{appeal_id}/review")
async def admin_review_appeal(
    appeal_id: int,
    status: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_moderator),
):
    if status not in ("approved", "rejected"):
        raise ConflictException("Status must be approved or rejected")
    result = await db.execute(select(Appeal).where(Appeal.id == appeal_id))
    appeal = result.scalar_one_or_none()
    if not appeal:
        raise NotFoundException("Appeal not found")
    appeal.status = status
    appeal.reviewed_by = current_user.id
    appeal.reviewed_at = datetime.now(timezone.utc)
    await db.commit()

    if status == "approved":
        result = await db.execute(
            select(Restriction).where(Restriction.id == appeal.restriction_id)
        )
        restriction = result.scalar_one_or_none()
        if restriction:
            restriction.status = "lifted"
            restriction.lifted_at = datetime.now(timezone.utc)

    await db.commit()
    return {"message": f"Appeal {status}"}


# ─── Image Management ──────────────────────────────────────────────────


@router.get("/products/images", response_model=list[AdminProductImageResponse])
async def admin_list_images(
    is_deleted: bool | None = None,
    product_id: int | None = None,
    variant_id: int | None = None,
    subvariant_id: int | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_moderator),
):
    query = select(ProductImage)
    if is_deleted is not None:
        query = query.where(ProductImage.is_deleted == is_deleted)
    if product_id is not None:
        query = query.where(ProductImage.product_id == product_id)
    if variant_id is not None:
        query = query.where(ProductImage.variant_id == variant_id)
    if subvariant_id is not None:
        query = query.where(ProductImage.subvariant_id == subvariant_id)
    query = query.offset(skip).limit(limit).order_by(ProductImage.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()


@router.put("/products/images/{image_id}/restore", response_model=AdminProductImageResponse)
async def admin_restore_image(
    image_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_moderator),
):
    result = await db.execute(select(ProductImage).where(ProductImage.id == image_id))
    image = result.scalar_one_or_none()
    if not image:
        raise NotFoundException("Image not found")
    image.is_deleted = False
    image.deleted_at = None
    await db.commit()
    await db.refresh(image)
    return image
