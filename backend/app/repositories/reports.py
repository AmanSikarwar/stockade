from datetime import datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.order import Order, OrderLineItem
from app.models.product import Product
from app.repositories.base import OrganizationScopedRepository


class ReportsRepository(OrganizationScopedRepository):
    def __init__(self, session: Session, organization_id: UUID) -> None:
        super().__init__(session, organization_id)

    def revenue_since(self, start: datetime) -> list[tuple[datetime, object, int]]:
        day = func.date_trunc("day", Order.created_at).label("day")
        rows = self.session.execute(
            select(
                day,
                func.coalesce(func.sum(Order.total_amount), 0),
                func.count(Order.id),
            )
            .where(
                Order.organization_id == self.organization_id,
                Order.status == "active",
                Order.created_at >= start,
            )
            .group_by(day)
            .order_by(day)
        ).all()
        return [(row[0], row[1], row[2]) for row in rows]

    def top_products(self, limit: int) -> list[tuple[UUID, str, str, int, object]]:
        revenue = func.sum(OrderLineItem.line_total)
        rows = self.session.execute(
            select(
                Product.id,
                Product.name,
                Product.sku,
                func.sum(OrderLineItem.quantity_ordered),
                revenue,
            )
            .select_from(OrderLineItem)
            .join(Order, Order.id == OrderLineItem.order_id)
            .join(Product, Product.id == OrderLineItem.product_id)
            .where(
                Order.organization_id == self.organization_id,
                Order.status == "active",
            )
            .group_by(Product.id, Product.name, Product.sku)
            .order_by(revenue.desc(), Product.name)
            .limit(limit)
        ).all()
        return [(row[0], row[1], row[2], row[3], row[4]) for row in rows]

    def sales_by_customer(self, limit: int) -> list[tuple[UUID, str, int, object]]:
        revenue = func.coalesce(func.sum(Order.total_amount), 0)
        rows = self.session.execute(
            select(
                Customer.id,
                Customer.full_name,
                func.count(Order.id),
                revenue,
            )
            .select_from(Order)
            .join(Customer, Customer.id == Order.customer_id)
            .where(
                Order.organization_id == self.organization_id,
                Order.status == "active",
            )
            .group_by(Customer.id, Customer.full_name)
            .order_by(revenue.desc(), Customer.full_name)
            .limit(limit)
        ).all()
        return [(row[0], row[1], row[2], row[3]) for row in rows]
