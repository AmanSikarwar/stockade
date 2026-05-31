from __future__ import annotations

from datetime import datetime
from uuid import UUID

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Index, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.models.mixins import IdMixin

# System reasons are recorded automatically; the rest are valid manual adjustments.
SYSTEM_REASONS = ("order", "cancellation")
MANUAL_REASONS = ("manual", "correction", "restock", "damage")
ALL_REASONS = (*SYSTEM_REASONS, *MANUAL_REASONS)
_REASON_SQL = ", ".join(f"'{reason}'" for reason in ALL_REASONS)


class StockMovement(IdMixin, Base):
    """Append-only audit record of every change to a product's on-hand quantity."""

    __tablename__ = "stock_movements"
    __table_args__ = (
        CheckConstraint("delta <> 0", name="delta_non_zero"),
        CheckConstraint("resulting_quantity >= 0", name="resulting_quantity_non_negative"),
        CheckConstraint(f"reason IN ({_REASON_SQL})", name="reason_allowed"),
        Index("ix_stock_movements_organization_id", "organization_id"),
        Index("ix_stock_movements_product_id", "product_id"),
        Index("ix_stock_movements_organization_id_created_at", "organization_id", "created_at"),
    )

    organization_id: Mapped[UUID] = mapped_column(
        PostgresUUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    product_id: Mapped[UUID] = mapped_column(
        PostgresUUID(as_uuid=True),
        ForeignKey("products.id", ondelete="RESTRICT"),
        nullable=False,
    )
    reference_order_id: Mapped[UUID | None] = mapped_column(
        PostgresUUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="SET NULL"),
        nullable=True,
    )
    delta: Mapped[int] = mapped_column(Integer, nullable=False)
    resulting_quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    reason: Mapped[str] = mapped_column(String(32), nullable=False)
    note: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )
