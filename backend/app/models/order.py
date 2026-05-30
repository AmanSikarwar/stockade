from __future__ import annotations

from decimal import Decimal
from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import CheckConstraint, ForeignKey, Index, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import IdMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.customer import Customer
    from app.models.organization import Organization
    from app.models.product import Product


class Order(IdMixin, TimestampMixin, Base):
    __tablename__ = "orders"
    __table_args__ = (
        CheckConstraint("status IN ('active', 'cancelled')", name="status_allowed"),
        CheckConstraint("total_amount >= 0", name="total_amount_non_negative"),
        Index("ix_orders_organization_id", "organization_id"),
        Index("ix_orders_customer_id", "customer_id"),
        Index("ix_orders_status", "status"),
    )

    organization_id: Mapped[UUID] = mapped_column(
        PostgresUUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    customer_id: Mapped[UUID] = mapped_column(
        PostgresUUID(as_uuid=True),
        ForeignKey("customers.id", ondelete="RESTRICT"),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="active")
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    organization: Mapped[Organization] = relationship(back_populates="orders")
    customer: Mapped[Customer] = relationship(back_populates="orders")
    line_items: Mapped[list[OrderLineItem]] = relationship(
        back_populates="order",
        cascade="all, delete-orphan",
    )


class OrderLineItem(IdMixin, Base):
    __tablename__ = "order_line_items"
    __table_args__ = (
        CheckConstraint("quantity_ordered > 0", name="quantity_positive"),
        CheckConstraint("unit_price >= 0", name="unit_price_non_negative"),
        CheckConstraint("line_total >= 0", name="line_total_non_negative"),
        Index("ix_order_line_items_order_id", "order_id"),
        Index("ix_order_line_items_product_id", "product_id"),
    )

    order_id: Mapped[UUID] = mapped_column(
        PostgresUUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False,
    )
    product_id: Mapped[UUID] = mapped_column(
        PostgresUUID(as_uuid=True),
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
    )
    quantity_ordered: Mapped[int] = mapped_column(Integer, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    line_total: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)

    order: Mapped[Order] = relationship(back_populates="line_items")
    product: Mapped[Product] = relationship(back_populates="order_line_items")
