from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.order import Order
from app.models.product import Product
from app.repositories.base import OrganizationScopedRepository


class DashboardRepository(OrganizationScopedRepository):
    def __init__(self, session: Session, organization_id: UUID) -> None:
        super().__init__(session, organization_id)

    def total_products(self) -> int:
        return (
            self.session.scalar(
                select(func.count(Product.id)).where(
                    Product.organization_id == self.organization_id
                )
            )
            or 0
        )

    def total_active_products(self) -> int:
        return (
            self.session.scalar(
                select(func.count(Product.id)).where(
                    Product.organization_id == self.organization_id,
                    Product.active.is_(True),
                )
            )
            or 0
        )

    def total_customers(self) -> int:
        return (
            self.session.scalar(
                select(func.count(Customer.id)).where(
                    Customer.organization_id == self.organization_id
                )
            )
            or 0
        )

    def total_orders(self) -> int:
        return (
            self.session.scalar(
                select(func.count(Order.id)).where(Order.organization_id == self.organization_id)
            )
            or 0
        )

    def total_orders_by_status(self, status: str) -> int:
        return (
            self.session.scalar(
                select(func.count(Order.id)).where(
                    Order.organization_id == self.organization_id,
                    Order.status == status,
                )
            )
            or 0
        )

    def low_stock_products(self, *, threshold: int, limit: int) -> tuple[list[Product], int]:
        # A product is low on stock when its on-hand quantity is at or below its own
        # reorder point, falling back to the organization-wide threshold when unset.
        effective_threshold = func.coalesce(Product.reorder_point, threshold)
        conditions = [
            Product.organization_id == self.organization_id,
            Product.active.is_(True),
            Product.quantity_in_stock <= effective_threshold,
        ]
        total = self.session.scalar(select(func.count(Product.id)).where(*conditions)) or 0
        products = list(
            self.session.scalars(
                select(Product)
                .where(*conditions)
                .order_by(Product.quantity_in_stock.asc(), Product.sku.asc(), Product.id)
                .limit(limit)
            ).all()
        )
        return products, total
