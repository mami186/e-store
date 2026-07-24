from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import ConflictException, ForbiddenException, NotFoundException
from app.core.history import record_history
from app.models.product import Product, ProductComment, ProductImage, ProductSubVariant, ProductVariant
from app.models.report import Report
from app.models.user import Seller, User
from app.schemas.product import (
    CommentCreate,
    CommentResponse,
    ProductCreate,
    ProductListItem,
    ProductResponse,
    ProductUpdate,
    ReportCreate,
    ReportResponse,
    SubVariantCreate,
    SubVariantUpdate,
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
    for v in product.variants:
        _ = v.subvariants
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

    await record_history(db, product, "update", current_user.id)

    if data.name is not None:
        product.name = data.name
    if data.description is not None:
        product.description = data.description
    if data.category is not None:
        product.category = data.category
    if data.status is not None:
        product.status = data.status
    product.version += 1
    await db.commit()
    await db.refresh(product)
    _ = product.variants
    _ = product.images
    for v in product.variants:
        _ = v.subvariants
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

    await record_history(db, product, "delete", current_user.id)
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
        price=data.price,
        compare_at_price=data.compare_at_price,
        stock=data.stock,
        attributes=data.attributes,
        is_default=data.is_default,
    )
    db.add(variant)
    await db.commit()
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    await db.refresh(product)
    _ = product.variants
    _ = product.images
    for v in product.variants:
        _ = v.subvariants
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

    await record_history(db, variant, "update", current_user.id)

    if data.sku is not None:
        variant.sku = data.sku
    if data.variant_name is not None:
        variant.variant_name = data.variant_name
    if data.price is not None:
        variant.price = data.price
    if data.compare_at_price is not None:
        variant.compare_at_price = data.compare_at_price
    if data.stock is not None:
        variant.stock = data.stock
    if data.attributes is not None:
        variant.attributes = data.attributes
    if data.is_default is not None:
        variant.is_default = data.is_default
    if data.is_active is not None:
        variant.is_active = data.is_active
    variant.version += 1
    await db.commit()
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    await db.refresh(product)
    _ = product.variants
    _ = product.images
    for v in product.variants:
        _ = v.subvariants
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

    await record_history(db, variant, "delete", current_user.id)
    await db.delete(variant)
    await db.commit()


@router.post("/{product_id}/variants/{variant_id}/subvariants", response_model=ProductResponse, status_code=201)
async def create_subvariant(
    product_id: int,
    variant_id: int,
    data: SubVariantCreate,
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

    result = await db.execute(
        select(ProductSubVariant).where(
            ProductSubVariant.variant_id == variant_id,
            ProductSubVariant.sku == data.sku,
        )
    )
    if result.scalar_one_or_none():
        raise ConflictException("SubVariant SKU already exists in this variant")

    sub = ProductSubVariant(
        variant_id=variant_id,
        sku=data.sku,
        subvariant_name=data.subvariant_name,
        price=data.price,
        stock=data.stock,
        attributes=data.attributes,
        is_default=data.is_default,
    )
    db.add(sub)
    await db.commit()
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    await db.refresh(product)
    _ = product.variants
    _ = product.images
    for v in product.variants:
        _ = v.subvariants
    return product


@router.put("/{product_id}/variants/{variant_id}/subvariants/{subvariant_id}", response_model=ProductResponse)
async def update_subvariant(
    product_id: int,
    variant_id: int,
    subvariant_id: int,
    data: SubVariantUpdate,
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
        select(ProductSubVariant).where(
            ProductSubVariant.id == subvariant_id,
            ProductSubVariant.variant_id == variant_id,
        )
    )
    sub = result.scalar_one_or_none()
    if not sub:
        raise NotFoundException("SubVariant not found")

    await record_history(db, sub, "update", current_user.id)

    if data.sku is not None:
        sub.sku = data.sku
    if data.subvariant_name is not None:
        sub.subvariant_name = data.subvariant_name
    if data.price is not None:
        sub.price = data.price
    if data.stock is not None:
        sub.stock = data.stock
    if data.attributes is not None:
        sub.attributes = data.attributes
    if data.is_default is not None:
        sub.is_default = data.is_default
    if data.is_active is not None:
        sub.is_active = data.is_active
    sub.version += 1
    await db.commit()
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    await db.refresh(product)
    _ = product.variants
    _ = product.images
    for v in product.variants:
        _ = v.subvariants
    return product


@router.delete("/{product_id}/variants/{variant_id}/subvariants/{subvariant_id}", status_code=204)
async def delete_subvariant(
    product_id: int,
    variant_id: int,
    subvariant_id: int,
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
        select(ProductSubVariant).where(
            ProductSubVariant.id == subvariant_id,
            ProductSubVariant.variant_id == variant_id,
        )
    )
    sub = result.scalar_one_or_none()
    if not sub:
        raise NotFoundException("SubVariant not found")

    await record_history(db, sub, "delete", current_user.id)
    await db.delete(sub)
    await db.commit()


@router.post("/{product_id}/reports", response_model=ReportResponse, status_code=201)
async def report_product(
    product_id: int,
    data: ReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise NotFoundException("Product not found")

    _ = product.variants
    version_vector = {
        "product_version": product.version,
        "variants": [],
    }
    for v in product.variants:
        v_info = {"variant_id": v.id, "variant_version": v.version, "subvariants": []}
        _ = v.subvariants
        for sv in v.subvariants:
            v_info["subvariants"].append({
                "subvariant_id": sv.id,
                "subvariant_version": sv.version,
            })
        version_vector["variants"].append(v_info)

    report = Report(
        reporter_id=current_user.id,
        product_id=product_id,
        reason_text=data.reason_text,
        version_vector=version_vector,
    )
    db.add(report)
    await db.commit()
    await db.refresh(report)
    return report


@router.post("/{product_id}/comments", response_model=CommentResponse, status_code=201)
async def create_comment(
    product_id: int,
    data: CommentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    if not result.scalar_one_or_none():
        raise NotFoundException("Product not found")

    comment = ProductComment(
        product_id=product_id,
        user_id=current_user.id,
        content=data.content,
        rating=data.rating,
        parent_comment_id=data.parent_comment_id,
    )
    db.add(comment)
    await db.commit()
    await db.refresh(comment)
    _ = comment.replies
    return comment


@router.get("/{product_id}/comments", response_model=list[CommentResponse])
async def list_comments(
    product_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ProductComment)
        .where(ProductComment.product_id == product_id, ProductComment.status == "approved")
        .order_by(ProductComment.created_at.desc())
    )
    return result.scalars().all()


@router.delete("/{product_id}/comments/{comment_id}", status_code=204)
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
