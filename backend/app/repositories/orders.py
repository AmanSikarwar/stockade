from collections.abc import Sequence
from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.customer import Customer
from app.models.order import Order, OrderLineItem
from app.models.product import Product
from app.repositories.base import OrganizationScopedRepository


class OrderRepository(OrganizationScopedRepository):
    def __init__(self, session: Session, organization_id: UUID) -> None:
        super().__init__(session, organization_id)

    def list(
        self,
        *,
        limit: int,
        offset: int,
        status: str | None,
        customer_id: UUID | None,
    ) -> tuple[list[Order], int]:
        conditions = [Order.organization_id == self.organization_id]
        if status is not None:
            conditions.append(Order.status == status)
        if customer_id is not None:
            conditions.append(Order.customer_id == customer_id)

        total = self.session.scalar(select(func.count(Order.id)).where(*conditions)) or 0
        orders = list(
            self.session.scalars(
                select(Order)
                .where(*conditions)
                .order_by(Order.created_at.desc(), Order.id)
                .limit(limit)
                .offset(offset)
            ).all()
        )
        return orders, total

    def get_by_id(self, order_id: UUID) -> Order | None:
        return self.session.scalars(
            select(Order)
            .where(
                Order.id == order_id,
                Order.organization_id == self.organization_id,
            )
            .options(selectinload(Order.line_items).selectinload(OrderLineItem.product))
        ).one_or_none()

    def get_by_id_for_update(self, order_id: UUID) -> Order | None:
        return self.session.scalars(
            select(Order)
            .where(
                Order.id == order_id,
                Order.organization_id == self.organization_id,
            )
            .with_for_update(of=Order)
        ).one_or_none()

    def get_customer_by_id(self, customer_id: UUID) -> Customer | None:
        return self.session.scalars(
            select(Customer).where(
                Customer.id == customer_id,
                Customer.organization_id == self.organization_id,
            )
        ).one_or_none()

    def get_active_products_for_update(self, product_ids: Sequence[UUID]) -> list[Product]:
        return list(
            self.session.scalars(
                select(Product)
                .where(
                    Product.organization_id == self.organization_id,
                    Product.id.in_(product_ids),
                    Product.active.is_(True),
                )
                .order_by(Product.id)
                .with_for_update(of=Product)
            ).all()
        )

    def get_products_for_update(self, product_ids: Sequence[UUID]) -> list[Product]:
        return list(
            self.session.scalars(
                select(Product)
                .where(
                    Product.organization_id == self.organization_id,
                    Product.id.in_(product_ids),
                )
                .order_by(Product.id)
                .with_for_update(of=Product)
            ).all()
        )

    def get_line_items(self, order_id: UUID) -> list[OrderLineItem]:
        return list(
            self.session.scalars(
                select(OrderLineItem).where(OrderLineItem.order_id == order_id)
            ).all()
        )

    def create_order(
        self,
        *,
        customer_id: UUID,
        total_amount: Decimal,
        line_items: Sequence[OrderLineItem],
    ) -> Order:
        order = Order(
            organization_id=self.organization_id,
            customer_id=customer_id,
            status="active",
            total_amount=total_amount,
        )
        order.line_items.extend(line_items)
        self.session.add(order)
        return order
