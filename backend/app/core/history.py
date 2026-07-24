from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import (
    Product,
    ProductHistory,
    ProductVariant,
    SubVariantHistory,
    VariantHistory,
    ProductSubVariant,
)


_HISTORY_MAP: dict[type, type] = {
    Product: ProductHistory,
    ProductVariant: VariantHistory,
    ProductSubVariant: SubVariantHistory,
}


async def record_history(
    db: AsyncSession,
    instance: Any,
    operation: str,
    changed_by: int | None = None,
):
    history_cls = _HISTORY_MAP.get(type(instance))
    if not history_cls:
        return

    data: dict[str, Any] = {}
    for col in instance.__table__.columns:
        data[col.name] = getattr(instance, col.name, None)

    data["operation"] = operation
    data["changed_by"] = changed_by
    data["changed_at"] = datetime.now(timezone.utc)

    db.add(history_cls(**data))
