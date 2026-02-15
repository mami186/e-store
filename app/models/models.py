from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    String,
    Boolean,
    DECIMAL,
    Text,
    UniqueConstraint,
    DateTime,
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.db.database import Base


# =========================
# USER
# =========================


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)

    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)

    email = Column(String, unique=True, nullable=False)
    username = Column(String, unique=True, nullable=False)

    password = Column(String, nullable=False)

    email_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Association object pattern (NO secondary)
    user_roles = relationship(
        "UserRole",
        foreign_keys="UserRole.user_id",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    assigned_roles = relationship(
        "UserRole",
        foreign_keys="UserRole.assigned_by",
        back_populates="assigned_by_user",
    )

    seller = relationship(
        "Seller", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )

    comments = relationship(
        "ProductComment", back_populates="user", cascade="all, delete-orphan"
    )

    carts = relationship("Cart", back_populates="user", cascade="all, delete-orphan")

    wishlists = relationship(
        "Wishlist", back_populates="user", cascade="all, delete-orphan"
    )

    # Convenience property (optional)
    @property
    def roles(self):
        return [ur.role for ur in self.user_roles]


# =========================
# ROLE
# =========================


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True)

    name = Column(String, unique=True, nullable=False)
    description = Column(String)

    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user_roles = relationship(
        "UserRole", back_populates="role", cascade="all, delete-orphan"
    )

    # Convenience property
    @property
    def users(self):
        return [ur.user for ur in self.user_roles]


# =========================
# USER ROLE (Association Table with extra fields)
# =========================


class UserRole(Base):
    __tablename__ = "user_roles"

    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )

    role_id = Column(
        Integer, ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True
    )

    assigned_by = Column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )

    assigned_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user = relationship("User", foreign_keys=[user_id], back_populates="user_roles")

    role = relationship("Role", back_populates="user_roles")

    assigned_by_user = relationship(
        "User", foreign_keys=[assigned_by], back_populates="assigned_roles"
    )

    __table_args__ = (UniqueConstraint("user_id", "role_id", name="uq_user_role"),)


# =========================
# SELLER
# =========================


class Seller(Base):
    __tablename__ = "sellers"

    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )

    shop_name = Column(String, nullable=False)
    shop_description = Column(Text)

    payout_account = Column(String)

    is_active = Column(Boolean, default=True)
    verification_status = Column(String, default="pending")

    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    user = relationship("User", back_populates="seller")

    products = relationship(
        "Product", back_populates="seller", cascade="all, delete-orphan"
    )


# =========================
# PRODUCT
# =========================


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True)

    seller_id = Column(
        Integer,
        ForeignKey("sellers.user_id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name = Column(String, nullable=False)
    description = Column(Text)

    status = Column(String, default="draft")

    is_active = Column(Boolean, default=True)
    delisted = Column(Boolean, default=False)

    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    seller = relationship("Seller", back_populates="products")

    variants = relationship(
        "ProductVariant", back_populates="product", cascade="all, delete-orphan"
    )

    images = relationship(
        "ProductImage", back_populates="product", cascade="all, delete-orphan"
    )

    comments = relationship(
        "ProductComment", back_populates="product", cascade="all, delete-orphan"
    )


# =========================
# PRODUCT VARIANT
# =========================


class ProductVariant(Base):
    __tablename__ = "product_variants"

    id = Column(Integer, primary_key=True)

    product_id = Column(
        Integer,
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    variant_name = Column(String, nullable=False)
    price = Column(DECIMAL(10, 2), nullable=False)

    stock = Column(Integer, default=0)

    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)

    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    product = relationship("Product", back_populates="variants")

    images = relationship(
        "ProductImage", back_populates="variant", cascade="all, delete-orphan"
    )

    __table_args__ = (
        UniqueConstraint("product_id", "variant_name", name="uq_product_variant"),
    )


# =========================
# PRODUCT IMAGE
# =========================


class ProductImage(Base):
    __tablename__ = "product_images"

    id = Column(Integer, primary_key=True)

    product_id = Column(
        Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )

    variant_id = Column(
        Integer, ForeignKey("product_variants.id", ondelete="CASCADE"), nullable=True
    )

    url = Column(String, nullable=False)
    alt_text = Column(String)

    is_main = Column(Boolean, default=False)

    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    product = relationship("Product", back_populates="images")
    variant = relationship("ProductVariant", back_populates="images")


# =========================
# PRODUCT COMMENT
# =========================


class ProductComment(Base):
    __tablename__ = "product_comments"

    id = Column(Integer, primary_key=True)

    product_id = Column(
        Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False
    )

    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    parent_comment_id = Column(
        Integer, ForeignKey("product_comments.id", ondelete="CASCADE"), nullable=True
    )

    rating = Column(Integer)
    content = Column(Text, nullable=False)
    status = Column(String, default="pending")

    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    product = relationship("Product", back_populates="comments")
    user = relationship("User", back_populates="comments")

    parent = relationship("ProductComment", remote_side=[id], back_populates="replies")

    replies = relationship(
        "ProductComment", back_populates="parent", cascade="all, delete-orphan"
    )


class Cart(Base):
    __tablename__ = 'carts'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship('User', back_populates='carts')
    items = relationship('CartItem', back_populates='cart')


class CartItem(Base):
    __tablename__ = 'cart_items'
    id = Column(Integer, primary_key=True)
    cart_id = Column(Integer, ForeignKey('carts.id'), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey('products.id'), nullable=False, index=True)
    variant_id = Column(Integer, ForeignKey('product_variants.id'), nullable=True, index=True)
    quantity = Column(Integer, nullable=False)

    cart = relationship('Cart', back_populates='items')
    product = relationship('Product')
    variant = relationship('ProductVariant')

    __table_args__ = (
        UniqueConstraint('cart_id', 'product_id', 'variant_id', name='uq_cart_item'),
    )


class Wishlist(Base):
    __tablename__ = 'wishlists'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    user = relationship('User', back_populates='wishlists')
    items = relationship('WishlistItem', back_populates='wishlist')


class WishlistItem(Base):
    __tablename__ = 'wishlist_items'
    wishlist_id = Column(Integer, ForeignKey('wishlists.id'), primary_key=True)
    product_id = Column(Integer, ForeignKey('products.id'), primary_key=True)
    variant_id = Column(Integer, ForeignKey('product_variants.id'), primary_key=True)
    added_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    wishlist = relationship('Wishlist', back_populates='items')
    product = relationship('Product')
    variant = relationship('ProductVariant')
