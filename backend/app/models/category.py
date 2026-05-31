from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from sqlalchemy import ForeignKey, Index, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID as PostgresUUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import IdMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.organization import Organization
    from app.models.product import Product


class Category(IdMixin, TimestampMixin, Base):
    __tablename__ = "categories"
    __table_args__ = (
        UniqueConstraint("organization_id", "name", name="uq_categories_organization_id_name"),
        Index("ix_categories_organization_id", "organization_id"),
    )

    organization_id: Mapped[UUID] = mapped_column(
        PostgresUUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="RESTRICT"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)

    organization: Mapped[Organization] = relationship(back_populates="categories")
    products: Mapped[list[Product]] = relationship(back_populates="category")
