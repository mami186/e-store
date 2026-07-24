from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class RestrictionReason(Base):
    __tablename__ = "restriction_reasons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    reason_text: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )


class Restriction(Base):
    __tablename__ = "restrictions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    restricted_by: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=False
    )
    report_id: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("reports.id", ondelete="SET NULL"), nullable=True
    )
    reason_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("restriction_reasons.id"), nullable=False
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    penalty_days: Mapped[int | None] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="active")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    lifted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    user: Mapped["User"] = relationship(foreign_keys=[user_id])
    restricted_by_user: Mapped["User"] = relationship(foreign_keys=[restricted_by])
    reason: Mapped["RestrictionReason"] = relationship()

    @property
    def reason_text(self) -> str | None:
        return self.reason.reason_text if self.reason else None

    products: Mapped[list["RestrictionProduct"]] = relationship(
        back_populates="restriction", cascade="all, delete-orphan"
    )
    appeals: Mapped[list["Appeal"]] = relationship(
        back_populates="restriction", cascade="all, delete-orphan"
    )


class RestrictionProduct(Base):
    __tablename__ = "restriction_products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    restriction_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("restrictions.id", ondelete="CASCADE"), nullable=False
    )
    subvariant_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("product_subvariants.id", ondelete="SET NULL"), nullable=True
    )
    version_snapshot: Mapped[dict] = mapped_column(JSON, default=dict)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    restriction: Mapped["Restriction"] = relationship(back_populates="products")


class Appeal(Base):
    __tablename__ = "appeals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    restriction_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("restrictions.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    appeal_text: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    reviewed_by: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    restriction: Mapped["Restriction"] = relationship(back_populates="appeals")
    user: Mapped["User"] = relationship(foreign_keys=[user_id])
    reviewer: Mapped["User | None"] = relationship(foreign_keys=[reviewed_by])
