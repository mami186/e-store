from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.exceptions import ForbiddenException, NotFoundException
from app.models.product import Product, ProductComment
from app.models.user import User
from app.schemas.product import CommentCreate, CommentResponse
from app.api.deps import get_current_active_user

router = APIRouter(prefix="/products/{product_id}/comments", tags=["comments"])


@router.post("", response_model=CommentResponse, status_code=201)
async def create_comment(
    product_id: int,
    data: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise NotFoundException("Product not found")

    if data.parent_comment_id:
        result = await db.execute(
            select(ProductComment).where(
                ProductComment.id == data.parent_comment_id,
                ProductComment.product_id == product_id,
            )
        )
        if not result.scalar_one_or_none():
            raise NotFoundException("Parent comment not found")

    comment = ProductComment(
        product_id=product_id,
        user_id=current_user.id,
        parent_comment_id=data.parent_comment_id,
        rating=data.rating,
        content=data.content,
        status="approved",
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    return comment


@router.get("", response_model=list[CommentResponse])
async def list_comments(
    product_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ProductComment)
        .where(
            ProductComment.product_id == product_id,
            ProductComment.parent_comment_id == None,
            ProductComment.status == "approved",
        )
        .options(selectinload(ProductComment.replies))
        .order_by(ProductComment.created_at.desc())
    )
    return result.scalars().all()


@router.delete("/{comment_id}", status_code=204)
async def delete_comment(
    product_id: int,
    comment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(ProductComment).where(
            ProductComment.id == comment_id,
            ProductComment.product_id == product_id,
        )
    )
    comment = result.scalar_one_or_none()
    if not comment:
        raise NotFoundException("Comment not found")
    if comment.user_id != current_user.id and current_user.highest_role_id < 2:
        raise ForbiddenException("Not your comment")
    await db.delete(comment)
    await db.commit()
