from __future__ import annotations

from io import BytesIO

from fastapi import APIRouter, Depends, Query, UploadFile
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.exceptions import ConflictException, ForbiddenException, NotFoundException
from app.models.product import Product, ProductComment
from app.models.rating import CommentReport, ProductRating
from app.models.user import User
from app.schemas.product import (
    CommentCreate,
    CommentReportCreate,
    CommentReportResponse,
    CommentResponse,
)
from app.schemas.rating import RatingCreate, RatingResponse, RatingStats
from app.api.deps import get_current_active_user
from app.storage.s3 import storage

router = APIRouter(prefix="/products/{product_id}/comments", tags=["comments"])

REPORT_REASONS = [
    "Spam or advertising",
    "Offensive or inappropriate",
    "Harassment or bullying",
    "False information",
    "Conflict of interest",
    "Other",
]

MAX_REPLY_DEPTH = 4


def _format_comment(
    comment: ProductComment,
    user_rating: int | None = None,
    reply_count: int = 0,
) -> dict:
    return {
        "id": comment.id,
        "product_id": comment.product_id,
        "user_id": comment.user_id,
        "user_name": f"{comment.user.first_name or ''} {comment.user.last_name or ''}".strip() or "Anonymous",
        "user_avatar_url": comment.user.avatar_url,
        "parent_comment_id": comment.parent_comment_id,
        "user_rating": user_rating,
        "content": comment.content,
        "image_url": comment.image_url,
        "status": comment.status,
        "depth": comment.depth,
        "reply_count": reply_count,
        "created_at": comment.created_at.isoformat() if comment.created_at else None,
        "replies": [],
    }


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

    depth = 0
    if data.parent_comment_id:
        result = await db.execute(
            select(ProductComment).where(
                ProductComment.id == data.parent_comment_id,
                ProductComment.product_id == product_id,
            )
        )
        parent = result.scalar_one_or_none()
        if not parent:
            raise NotFoundException("Parent comment not found")
        if parent.depth >= MAX_REPLY_DEPTH:
            raise ConflictException("Maximum reply depth reached")
        depth = parent.depth + 1

    comment = ProductComment(
        product_id=product_id,
        user_id=current_user.id,
        parent_comment_id=data.parent_comment_id,
        depth=depth,
        content=data.content,
        image_url=data.image_url,
        status="approved",
    )
    db.add(comment)
    await db.flush()
    comment_id = comment.id
    await db.commit()

    rating_result = await db.execute(
        select(ProductRating.rating).where(
            ProductRating.user_id == current_user.id,
            ProductRating.product_id == product_id,
        )
    )
    user_rating = rating_result.scalar()

    query = (
        select(ProductComment)
        .where(ProductComment.id == comment_id)
        .options(selectinload(ProductComment.user))
    )
    result = await db.execute(query)
    comment = result.scalar_one()
    return _format_comment(comment, user_rating=user_rating)


async def _batch_reply_counts(
    db: AsyncSession,
    product_id: int,
    comment_ids: list[int],
) -> dict[int, int]:
    if not comment_ids:
        return {}
    result = await db.execute(
        select(
            ProductComment.parent_comment_id,
            func.count(ProductComment.id),
        )
        .where(
            ProductComment.product_id == product_id,
            ProductComment.parent_comment_id.in_(comment_ids),
            ProductComment.status == "approved",
        )
        .group_by(ProductComment.parent_comment_id)
    )
    return dict(result.all())


@router.get("", response_model=list[CommentResponse])
async def list_comments(
    product_id: int,
    rating: int | None = None,
    page: int = Query(1, ge=1),
    limit: int = Query(5, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(ProductComment)
        .where(
            ProductComment.product_id == product_id,
            ProductComment.parent_comment_id == None,
            ProductComment.status == "approved",
        )
        .options(selectinload(ProductComment.user))
        .order_by(ProductComment.created_at.desc())
    )

    if rating is not None:
        rating_subq = (
            select(ProductRating.user_id)
            .where(
                ProductRating.product_id == product_id,
                ProductRating.rating == rating,
            )
        )
        query = query.where(ProductComment.user_id.in_(rating_subq))

    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    comments = result.scalars().all()

    # batch user ratings
    user_ids = list({c.user_id for c in comments})
    rating_map: dict[int, int | None] = {}
    if user_ids:
        rating_result = await db.execute(
            select(ProductRating.user_id, ProductRating.rating)
            .where(
                ProductRating.product_id == product_id,
                ProductRating.user_id.in_(user_ids),
            )
        )
        for uid, r in rating_result:
            rating_map[uid] = r

    # batch reply counts
    comment_ids = [c.id for c in comments]
    rc_map = await _batch_reply_counts(db, product_id, comment_ids)

    return [
        _format_comment(c, user_rating=rating_map.get(c.user_id), reply_count=rc_map.get(c.id, 0))
        for c in comments
    ]


@router.get("/{comment_id}/replies", response_model=list[CommentResponse])
async def list_comment_replies(
    product_id: int,
    comment_id: int,
    page: int = Query(1, ge=1),
    limit: int = Query(5, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ProductComment).where(
            ProductComment.id == comment_id,
            ProductComment.product_id == product_id,
        )
    )
    if not result.scalar_one_or_none():
        raise NotFoundException("Comment not found")

    query = (
        select(ProductComment)
        .where(
            ProductComment.parent_comment_id == comment_id,
            ProductComment.status == "approved",
        )
        .options(selectinload(ProductComment.user))
        .order_by(ProductComment.created_at.asc())
    )

    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)
    result = await db.execute(query)
    comments = result.scalars().all()

    # batch user ratings
    user_ids = list({c.user_id for c in comments})
    rating_map: dict[int, int | None] = {}
    if user_ids:
        rating_result = await db.execute(
            select(ProductRating.user_id, ProductRating.rating)
            .where(
                ProductRating.product_id == product_id,
                ProductRating.user_id.in_(user_ids),
            )
        )
        for uid, r in rating_result:
            rating_map[uid] = r

    # batch reply counts
    comment_ids = [c.id for c in comments]
    rc_map = await _batch_reply_counts(db, product_id, comment_ids)

    return [
        _format_comment(c, user_rating=rating_map.get(c.user_id), reply_count=rc_map.get(c.id, 0))
        for c in comments
    ]


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


@router.post("/{comment_id}/report", response_model=CommentReportResponse, status_code=201)
async def report_comment(
    product_id: int,
    comment_id: int,
    data: CommentReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if data.reason not in REPORT_REASONS:
        raise ConflictException("Invalid report reason")

    result = await db.execute(
        select(ProductComment).where(
            ProductComment.id == comment_id,
            ProductComment.product_id == product_id,
        )
    )
    if not result.scalar_one_or_none():
        raise NotFoundException("Comment not found")

    report = CommentReport(
        comment_id=comment_id,
        reporter_id=current_user.id,
        reason=data.reason,
        description=data.description,
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report


@router.post("/upload-image", response_model=dict)
async def upload_comment_image(
    product_id: int,
    file: UploadFile,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    contents = await file.read()
    key = await storage.upload_fileobj(BytesIO(contents), file.filename, prefix="comment-images")
    if not key:
        raise ConflictException("Image upload failed")
    url = await storage.get_presigned_url(key)
    return {"key": key, "url": url}


@router.get("/rating", response_model=RatingStats)
async def get_rating_stats(
    product_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(
            func.avg(ProductRating.rating),
            func.count(ProductRating.id),
        ).where(ProductRating.product_id == product_id)
    )
    row = result.one()
    average = round(float(row[0]), 1) if row[0] else 0.0
    total = row[1] or 0

    distribution = []
    for star in range(1, 6):
        r = await db.execute(
            select(func.count(ProductRating.id)).where(
                ProductRating.product_id == product_id,
                ProductRating.rating == star,
            )
        )
        distribution.append(r.scalar() or 0)

    return RatingStats(average=average, total=total, distribution=distribution)


@router.post("/rating", response_model=RatingResponse)
async def upsert_rating(
    product_id: int,
    data: RatingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    if not result.scalar_one_or_none():
        raise NotFoundException("Product not found")

    result = await db.execute(
        select(ProductRating).where(
            ProductRating.user_id == current_user.id,
            ProductRating.product_id == product_id,
        )
    )
    rating = result.scalar_one_or_none()
    if rating:
        rating.rating = data.rating
    else:
        rating = ProductRating(
            user_id=current_user.id,
            product_id=product_id,
            rating=data.rating,
        )
        db.add(rating)
    await db.commit()
    await db.refresh(rating)
    return rating
