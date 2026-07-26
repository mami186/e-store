from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.models.featured import FeaturedItem
from app.models.product import Product, ProductVariant
from app.schemas.featured import FeaturedItemResponse, FeaturedVariantInfo
from app.schemas.product import ProductListItem

router = APIRouter(tags=["featured"])


@router.get("/featured", response_model=list[FeaturedItemResponse])
async def get_featured_items(
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(FeaturedItem)
        .where(FeaturedItem.is_active == True)
        .order_by(FeaturedItem.position)
        .options(
            selectinload(FeaturedItem.product).selectinload(Product.category),
            selectinload(FeaturedItem.variant).selectinload(ProductVariant.images),
            selectinload(FeaturedItem.variant).selectinload(ProductVariant.product),
        )
    )
    items = result.scalars().all()

    response = []
    for item in items:
        if item.product_id and item.product:
            product = item.product
            product_data = ProductListItem(
                id=product.id,
                name=product.name,
                category=product.category,
                status=product.status,
                is_active=product.is_active,
                main_image=product.main_image,
                min_price=product.min_price,
                max_price=product.max_price,
                avg_rating=None,
                rating_count=0,
                created_at=product.created_at,
            )
            response.append(
                FeaturedItemResponse(
                    id=item.id,
                    position=item.position,
                    start_date=item.start_date,
                    end_date=item.end_date,
                    is_active=item.is_active,
                    product=product_data,
                    variant=None,
                    created_at=item.created_at,
                )
            )
        elif item.variant_id and item.variant:
            variant = item.variant
            variant_data = FeaturedVariantInfo(
                id=variant.id,
                name=variant.variant_name,
                price=variant.price,
                image=variant.main_image,
                product_id=variant.product_id,
                product_name=variant.product.name if variant.product else "",
            )
            response.append(
                FeaturedItemResponse(
                    id=item.id,
                    position=item.position,
                    start_date=item.start_date,
                    end_date=item.end_date,
                    is_active=item.is_active,
                    product=None,
                    variant=variant_data,
                    created_at=item.created_at,
                )
            )

    return response
