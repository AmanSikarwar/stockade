from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import IdMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.category import Category
    from app.models.order import OrderLineItem
    from app.models.organization import Organization


class Product(IdMixin, TimestampMixin, Base):
    __tablename__ = "products"
    __table_args__ = (
        CheckConstraint("price >= 0", name="price_non_negative"),
        CheckConstraint("quantity_in_stock >= 0", name="quantity_non_negative"),
        CheckConstraint(
            "reorder_point IS NULL OR reorder_point >= 0",
            name="reorder_point_non_negative",
        ),
        UniqueConstraint("organization_id", "sku", name="uq_products_organization_id_sku"),
        Index("ix_products_organization_id", "organization_id"),
        Index(
            "ix_products_organization_id_active_quantity",
            "organization_id",
            "active",
            "quantity_in_stock",
        ),
        Index("ix_products_sku", "sku"),
        Index("ix_products_active", "active"),
        Index("ix_products_category_id", "category_id"),
    )

    organization_id: Mapped[UUID] = mapped_column(
        PostgresUUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    category_id: Mapped[UUID | None] = mapped_column(
        PostgresUUID(as_uuid=True),
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    sku: Mapped[str] = mapped_column(String(100), nullable=False)
    price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    quantity_in_stock: Mapped[int] = mapped_column(Integer, nullable=False)
    reorder_point: Mapped[int | None] = mapped_column(Integer, nullable=True)
    active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    organization: Mapped[Organization] = relationship(back_populates="products")
    category: Mapped[Category | None] = relationship(back_populates="products")
    order_line_items: Mapped[list[OrderLineItem]] = relationship(back_populates="product")
