from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.exceptions import ConflictException, ForbiddenException, NotFoundException
from app.core.history import record_history
from app.models.product import Product, ProductImage, ProductSubVariant, ProductVariant
from app.models.rating import ProductRating
from app.models.report import Report
from app.models.restriction import Restriction
from app.models.user import Seller, User
from app.schemas.product import (
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

    restriction_result = await db.execute(
        select(Restriction).where(
            Restriction.user_id == current_user.id,
            Restriction.status == "active",
        )
    )
    if restriction_result.scalar_one_or_none():
        raise ForbiddenException("Account restricted. Cannot create products")

    product = Product(
        seller_id=current_user.id,
        name=data.name,
        short_description=data.short_description,
        long_description=data.long_description,
        category_id=data.category_id,
    )
    db.add(product)
    await db.commit()
    result = await db.execute(
        select(Product)
        .options(
            selectinload(Product.variants).selectinload(ProductVariant.subvariants),
            selectinload(Product.images),
            selectinload(Product.category),
        )
        .where(Product.id == product.id)
    )
    product = result.scalar_one()
    return product


@router.get("", response_model=list[ProductListItem])
async def list_products(
    category_id: int | None = None,
    seller_id: int | None = None,
    q: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    sort_by: str = Query("created_at", pattern=r"^(created_at|name|rating)$"),
    order: str = Query("desc", pattern=r"^(asc|desc)$"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    conditions = [
        Product.is_active == True,
        Product.status == "published",
        ~select(Restriction.id)
        .where(Restriction.user_id == Product.seller_id, Restriction.status == "active")
        .exists(),
    ]
    if category_id:
        conditions.append(Product.category_id == category_id)
    if seller_id:
        conditions.append(Product.seller_id == seller_id)
    if q:
        conditions.append(
            or_(Product.name.ilike(f"%{q}%"), Product.short_description.ilike(f"%{q}%"))
        )

    sv_exists = select(ProductSubVariant.id).where(
        ProductSubVariant.product_id == Product.id,
        ProductSubVariant.is_active == True,
    ).correlate(Product)
    if min_price is not None:
        sv_exists = sv_exists.where(ProductSubVariant.effective_price >= min_price)
    if max_price is not None:
        sv_exists = sv_exists.where(ProductSubVariant.effective_price <= max_price)
    conditions.append(sv_exists.exists())

    rating_subq = (
        select(
            ProductRating.product_id,
            func.avg(ProductRating.rating).label("avg_rating"),
            func.count(ProductRating.id).label("rating_count"),
        )
        .group_by(ProductRating.product_id)
        .subquery()
    )

    query = (
        select(Product, rating_subq.c.avg_rating, rating_subq.c.rating_count)
        .options(selectinload(Product.category))
        .outerjoin(rating_subq, rating_subq.c.product_id == Product.id)
        .where(*conditions)
    )

    if sort_by == "rating":
        sort_col = rating_subq.c.avg_rating
    else:
        sort_col = {"created_at": Product.created_at, "name": Product.name}[sort_by]
    query = query.order_by(sort_col.desc() if order == "desc" else sort_col.asc())

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    rows = result.all()
    return [
        ProductListItem(
            id=product.id,
            name=product.name,
            category=product.category,
            status=product.status,
            is_active=product.is_active,
            main_image=product.main_image,
            min_price=product.min_price,
            max_price=product.max_price,
            avg_rating=round(float(avg_rating), 1) if avg_rating else None,
            rating_count=rating_count or 0,
            created_at=product.created_at,
        )
        for product, avg_rating, rating_count in rows
    ]


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Product)
        .options(
            selectinload(Product.variants).selectinload(ProductVariant.subvariants),
            selectinload(Product.images),
            selectinload(Product.category),
        )
        .where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise NotFoundException("Product not found")
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

    if data.name is not None or data.short_description is not None or data.long_description is not None or data.category_id is not None:
        restriction_result = await db.execute(
            select(Restriction).where(
                Restriction.user_id == current_user.id,
                Restriction.status == "active",
            )
        )
        if restriction_result.scalar_one_or_none():
            raise ForbiddenException("Account restricted. Cannot edit products")

    await record_history(db, product, "update", current_user.id)

    if data.name is not None:
        product.name = data.name
    if data.short_description is not None:
        product.short_description = data.short_description
    if data.long_description is not None:
        product.long_description = data.long_description
    if data.category_id is not None:
        product.category_id = data.category_id
    if data.status is not None:
        product.status = data.status
    product.version += 1
    await db.commit()
    result = await db.execute(
        select(Product)
        .options(
            selectinload(Product.variants).selectinload(ProductVariant.subvariants),
            selectinload(Product.images),
            selectinload(Product.category),
        )
        .where(Product.id == product.id)
    )
    product = result.scalar_one()
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
    result = await db.execute(
        select(Product)
        .options(
            selectinload(Product.variants).selectinload(ProductVariant.subvariants),
            selectinload(Product.images),
            selectinload(Product.category),
        )
        .where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
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
    result = await db.execute(
        select(Product)
        .options(
            selectinload(Product.variants).selectinload(ProductVariant.subvariants),
            selectinload(Product.images),
            selectinload(Product.category),
        )
        .where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
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
    result = await db.execute(
        select(Product)
        .options(
            selectinload(Product.variants).selectinload(ProductVariant.subvariants),
            selectinload(Product.images),
            selectinload(Product.category),
        )
        .where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
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
    result = await db.execute(
        select(Product)
        .options(
            selectinload(Product.variants).selectinload(ProductVariant.subvariants),
            selectinload(Product.images),
            selectinload(Product.category),
        )
        .where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
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
    result = await db.execute(
        select(Product)
        .options(
            selectinload(Product.variants).selectinload(ProductVariant.subvariants),
        )
        .where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise NotFoundException("Product not found")

    version_vector = {
        "product_version": product.version,
        "variants": [],
    }
    for v in product.variants:
        v_info = {"variant_id": v.id, "variant_version": v.version, "subvariants": []}
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



