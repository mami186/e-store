from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    username: Mapped[str | None] = mapped_column(String(100), unique=True, nullable=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    first_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    last_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    google_id: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    token_version: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user_roles: Mapped[list[UserRole]] = relationship(
        back_populates="user", lazy="selectin", foreign_keys="UserRole.user_id"
    )
    refresh_tokens: Mapped[list[RefreshToken]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    seller: Mapped[Seller | None] = relationship(back_populates="user", uselist=False, lazy="selectin")
    addresses: Mapped[list[Address]] = relationship(back_populates="user", cascade="all, delete-orphan")
    cart: Mapped[Cart | None] = relationship(back_populates="user", uselist=False, cascade="all, delete-orphan")
    wishlist: Mapped[Wishlist | None] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    orders: Mapped[list[Order]] = relationship(back_populates="user")
    comments: Mapped[list[ProductComment]] = relationship(back_populates="user")

    @property
    def roles(self) -> list[Role]:
        return [ur.role for ur in self.user_roles]

    @property
    def highest_role_id(self) -> int:
        return max((r.id for r in self.roles), default=0)

    def has_role(self, required_role_id: int) -> bool:
        return any(r.id >= required_role_id for r in self.roles)


class Role(Base):
    __tablename__ = "roles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=False)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    description: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user_roles: Mapped[list[UserRole]] = relationship(back_populates="role")


class UserRole(Base):
    __tablename__ = "user_roles"
    __table_args__ = (UniqueConstraint("user_id", "role_id"),)

    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    role_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True
    )
    assigned_by: Mapped[int | None] = mapped_column(
        Integer, ForeignKey("users.id"), nullable=True
    )
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user: Mapped[User] = relationship(
        back_populates="user_roles", foreign_keys=[user_id], lazy="selectin"
    )
    role: Mapped[Role] = relationship(back_populates="user_roles", lazy="selectin")
    assigned_by_user: Mapped[User | None] = relationship(foreign_keys=[assigned_by])


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column(
        String(64), unique=True, index=True, nullable=False
    )
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user: Mapped[User] = relationship(back_populates="refresh_tokens")


class Seller(Base):
    __tablename__ = "sellers"

    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    shop_name: Mapped[str] = mapped_column(String(255), nullable=False)
    shop_description: Mapped[str | None] = mapped_column(Text, nullable=True)
    payout_account: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    verification_status: Mapped[str] = mapped_column(String(20), default="pending")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user: Mapped[User] = relationship(back_populates="seller", foreign_keys=[user_id])
    products: Mapped[list[Product]] = relationship(back_populates="seller")

    @property
    def is_verified(self) -> bool:
        return self.verification_status == "approved"


class TokenBlacklist(Base):
    __tablename__ = "token_blacklist"

    jti: Mapped[str] = mapped_column(String(64), primary_key=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)



