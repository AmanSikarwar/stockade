from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.models.mixins import IdMixin, TimestampMixin

if TYPE_CHECKING:
    from app.models.customer import Customer
    from app.models.order import Order
    from app.models.product import Product
    from app.models.user import User


class Organization(IdMixin, TimestampMixin, Base):
    __tablename__ = "organizations"

    display_name: Mapped[str] = mapped_column(String(255), nullable=False)

    users: Mapped[list[User]] = relationship(back_populates="organization")
    products: Mapped[list[Product]] = relationship(back_populates="organization")
    customers: Mapped[list[Customer]] = relationship(back_populates="organization")
    orders: Mapped[list[Order]] = relationship(back_populates="organization")
