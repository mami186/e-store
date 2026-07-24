from __future__ import annotations

from datetime import datetime, timezone
from io import BytesIO

from fastapi import APIRouter, Depends, Query, UploadFile
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.exceptions import ConflictException, ForbiddenException, NotFoundException
from app.models.product import Product, ProductImage
from app.models.user import User
from app.schemas.product import AdminProductImageResponse, ImageUpdate, ProductImageResponse
from app.api.deps import get_current_active_user, require_seller
from app.storage.s3 import storage

router = APIRouter(prefix="/products/{product_id}/images", tags=["images"])


async def _get_product(product_id: int, db: AsyncSession) -> Product:
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise NotFoundException("Product not found")
    return product


async def _get_image(image_id: int, db: AsyncSession) -> ProductImage:
    result = await db.execute(
        select(ProductImage).where(ProductImage.id == image_id)
    )
    image = result.scalar_one_or_none()
    if not image:
        raise NotFoundException("Image not found")
    return image


def _scope_filter(query, image: ProductImage):
    if image.variant_id is None and image.subvariant_id is None:
        return query.where(
            ProductImage.product_id == image.product_id,
            ProductImage.variant_id == None,
            ProductImage.subvariant_id == None,
            ProductImage.id != image.id,
        )
    if image.subvariant_id is None:
        return query.where(
            ProductImage.product_id == image.product_id,
            ProductImage.variant_id == image.variant_id,
            ProductImage.subvariant_id == None,
            ProductImage.id != image.id,
        )
    return query.where(
        ProductImage.product_id == image.product_id,
        ProductImage.variant_id == image.variant_id,
        ProductImage.subvariant_id == image.subvariant_id,
        ProductImage.id != image.id,
    )


async def _enrich_urls(images: list[ProductImage]):
    for img in images:
        img.url = (await storage.get_presigned_url(img.url)) or img.url
    return images


@router.post("", response_model=ProductImageResponse, status_code=201)
async def upload_image(
    product_id: int,
    file: UploadFile,
    variant_id: int | None = None,
    subvariant_id: int | None = None,
    alt_text: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_seller),
):
    product = await _get_product(product_id, db)
    if product.seller_id != current_user.id:
        raise ForbiddenException("Not your product")

    contents = await file.read()
    key = await storage.upload_fileobj(BytesIO(contents), file.filename)
    if not key:
        raise ConflictException("Image upload failed")

    scope_match = await db.execute(
        select(ProductImage).where(
            ProductImage.product_id == product_id,
            ProductImage.variant_id == variant_id,
            ProductImage.subvariant_id == subvariant_id,
            ProductImage.is_deleted == False,
        )
    )
    existing = scope_match.scalars().all()
    is_main = len(existing) == 0

    image = ProductImage(
        product_id=product_id,
        variant_id=variant_id,
        subvariant_id=subvariant_id,
        url=key,
        alt_text=alt_text,
        is_main=is_main,
    )
    db.add(image)
    await db.commit()
    await db.refresh(image)
    image.url = (await storage.get_presigned_url(image.url)) or image.url
    return image


@router.get("", response_model=list[ProductImageResponse])
async def list_images(
    product_id: int,
    variant_id: int | None = None,
    subvariant_id: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    await _get_product(product_id, db)
    query = select(ProductImage).where(
        ProductImage.product_id == product_id,
        ProductImage.is_deleted == False,
    )
    if variant_id is not None:
        query = query.where(ProductImage.variant_id == variant_id)
    if subvariant_id is not None:
        query = query.where(ProductImage.subvariant_id == subvariant_id)
    query = query.order_by(ProductImage.created_at.desc())
    result = await db.execute(query)
    images = list(result.scalars().all())
    return await _enrich_urls(images)


@router.get("/{image_id}", response_model=ProductImageResponse)
async def get_image(
    product_id: int,
    image_id: int,
    db: AsyncSession = Depends(get_db),
):
    await _get_product(product_id, db)
    image = await _get_image(image_id, db)
    if image.product_id != product_id:
        raise NotFoundException("Image not found for this product")
    image.url = (await storage.get_presigned_url(image.url)) or image.url
    return image


@router.put("/{image_id}", response_model=ProductImageResponse)
async def update_image(
    product_id: int,
    image_id: int,
    data: ImageUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_seller),
):
    product = await _get_product(product_id, db)
    if product.seller_id != current_user.id:
        raise ForbiddenException("Not your product")
    image = await _get_image(image_id, db)
    if image.product_id != product_id:
        raise NotFoundException("Image not found for this product")

    if data.alt_text is not None:
        image.alt_text = data.alt_text
    await db.commit()
    await db.refresh(image)
    image.url = (await storage.get_presigned_url(image.url)) or image.url
    return image


@router.put("/{image_id}/main", response_model=ProductImageResponse)
async def set_main_image(
    product_id: int,
    image_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_seller),
):
    product = await _get_product(product_id, db)
    if product.seller_id != current_user.id:
        raise ForbiddenException("Not your product")
    image = await _get_image(image_id, db)
    if image.product_id != product_id:
        raise NotFoundException("Image not found for this product")

    scope_query = _scope_filter(select(ProductImage), image)
    result = await db.execute(scope_query)
    for other in result.scalars().all():
        other.is_main = False

    image.is_main = True
    await db.commit()
    await db.refresh(image)
    image.url = (await storage.get_presigned_url(image.url)) or image.url
    return image


@router.delete("/{image_id}", status_code=204)
async def delete_image(
    product_id: int,
    image_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_seller),
):
    product = await _get_product(product_id, db)
    if product.seller_id != current_user.id:
        raise ForbiddenException("Not your product")
    image = await _get_image(image_id, db)
    if image.product_id != product_id:
        raise NotFoundException("Image not found for this product")

    image.is_deleted = True
    image.deleted_at = datetime.now(timezone.utc)
    await db.commit()
