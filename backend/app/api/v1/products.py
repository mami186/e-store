from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import ConflictException, ForbiddenException, NotFoundException
from app.models.product import Product, ProductComment, ProductImage, ProductVariant
from app.models.user import Seller, User
from app.schemas.product import (
    CommentCreate,
    CommentResponse,
    ProductCreate,
    ProductListItem,
    ProductResponse,
    ProductUpdate,
    VariantCreate,
    VariantUpdate,
)
from app.api.deps import get_current_active_user, require_seller

router = APIRouter(prefix="/products", tags=["products"])


@router.post("", response_model=ProductResponse, status_code=201)
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_seller),
):
    result = await db.execute(select(Seller).where(Seller.user_id == current_user.id))
    seller = result.scalar_one_or_none()
    if not seller or not seller.is_verified:
        raise ForbiddenException("Seller profile not verified")

    product = Product(
        seller_id=current_user.id,
        name=data.name,
        description=data.description,
        category=data.category,
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)
    _ = product.variants
    _ = product.images
    return product


@router.get("", response_model=list[ProductListItem])
async def list_products(
    category: str | None = None,
    seller_id: int | None = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(Product).where(Product.is_active == True, Product.status == "published")

    if category:
        query = query.where(Product.category == category)
    if seller_id:
        query = query.where(Product.seller_id == seller_id)

    query = query.order_by(Product.created_at.desc())
    result = await db.execute(query)
    products = result.scalars().all()
    return products


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise NotFoundException("Product not found")
    _ = product.variants
    _ = product.images
    return product


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: int,
    data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_seller),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise NotFoundException("Product not found")
    if product.seller_id != current_user.id:
        raise ForbiddenException("Not your product")

    if data.name is not None:
        product.name = data.name
    if data.description is not None:
        product.description = data.description
    if data.category is not None:
        product.category = data.category
    if data.status is not None:
        product.status = data.status
    await db.commit()
    await db.refresh(product)
    _ = product.variants
    _ = product.images
    return product


@router.delete("/{product_id}", status_code=204)
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_seller),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise NotFoundException("Product not found")
    if product.seller_id != current_user.id:
        raise ForbiddenException("Not your product")
    await db.delete(product)
    await db.commit()


@router.post("/{product_id}/variants", response_model=ProductResponse, status_code=201)
async def create_variant(
    product_id: int,
    data: VariantCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_seller),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise NotFoundException("Product not found")
    if product.seller_id != current_user.id:
        raise ForbiddenException("Not your product")

    result = await db.execute(
        select(ProductVariant).where(
            ProductVariant.product_id == product_id, ProductVariant.sku == data.sku
        )
    )
    if result.scalar_one_or_none():
        raise ConflictException("Variant SKU already exists")

    variant = ProductVariant(
        product_id=product_id,
        sku=data.sku,
        variant_name=data.variant_name,
        size=data.size,
        color=data.color,
        price=data.price,
        compare_at_price=data.compare_at_price,
        stock=data.stock,
        is_default=data.is_default,
    )
    db.add(variant)
    await db.commit()
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    _ = product.variants
    _ = product.images
    return product


@router.put("/{product_id}/variants/{variant_id}", response_model=ProductResponse)
async def update_variant(
    product_id: int,
    variant_id: int,
    data: VariantUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_seller),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise NotFoundException("Product not found")
    if product.seller_id != current_user.id:
        raise ForbiddenException("Not your product")

    result = await db.execute(
        select(ProductVariant).where(
            ProductVariant.id == variant_id, ProductVariant.product_id == product_id
        )
    )
    variant = result.scalar_one_or_none()
    if not variant:
        raise NotFoundException("Variant not found")

    if data.sku is not None:
        variant.sku = data.sku
    if data.variant_name is not None:
        variant.variant_name = data.variant_name
    if data.size is not None:
        variant.size = data.size
    if data.color is not None:
        variant.color = data.color
    if data.price is not None:
        variant.price = data.price
    if data.compare_at_price is not None:
        variant.compare_at_price = data.compare_at_price
    if data.stock is not None:
        variant.stock = data.stock
    if data.is_default is not None:
        variant.is_default = data.is_default
    if data.is_active is not None:
        variant.is_active = data.is_active
    await db.commit()
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    _ = product.variants
    _ = product.images
    return product


@router.delete("/{product_id}/variants/{variant_id}", status_code=204)
async def delete_variant(
    product_id: int,
    variant_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_seller),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise NotFoundException("Product not found")
    if product.seller_id != current_user.id:
        raise ForbiddenException("Not your product")

    result = await db.execute(
        select(ProductVariant).where(
            ProductVariant.id == variant_id, ProductVariant.product_id == product_id
        )
    )
    variant = result.scalar_one_or_none()
    if not variant:
        raise NotFoundException("Variant not found")
    await db.delete(variant)
    await db.commit()
