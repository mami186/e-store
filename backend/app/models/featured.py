from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class FeaturedItem(Base):
    __tablename__ = "featured_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=True
    )
    variant_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("product_variants.id", ondelete="CASCADE"), nullable=True
    )
    position: Mapped[int] = mapped_column(Integer, nullable=False)
    start_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    end_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    product: Mapped["Product | None"] = relationship(back_populates="featured_items")
    variant: Mapped["ProductVariant | None"] = relationship(back_populates="featured_items")
