from collections.abc import Sequence
from decimal import Decimal
from uuid import UUID

from sqlalchemy import String, cast, func, or_, select
from sqlalchemy.orm import Session, selectinload

from app.models.customer import Customer
from app.models.order import Order, OrderLineItem
from app.models.product import Product
from app.repositories.base import OrganizationScopedRepository, resolve_order

ORDER_SORTS = {
    "created_at": Order.created_at,
    "total_amount": Order.total_amount,
    "status": Order.status,
}


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
        search: str | None = None,
        sort_by: str | None = None,
        sort_dir: str = "desc",
    ) -> tuple[list[Order], int]:
        conditions = [Order.organization_id == self.organization_id]
        if status is not None:
            conditions.append(Order.status == status)
        if customer_id is not None:
            conditions.append(Order.customer_id == customer_id)
        if search:
            pattern = f"%{search}%"
            conditions.append(
                or_(
                    cast(Order.id, String).ilike(pattern),
                    cast(Order.customer_id, String).ilike(pattern),
                    Order.status.ilike(pattern),
                    Order.customer.has(
                        or_(Customer.full_name.ilike(pattern), Customer.email.ilike(pattern))
                    ),
                )
            )

        total = self.session.scalar(select(func.count(Order.id)).where(*conditions)) or 0
        ordering = resolve_order(ORDER_SORTS, Order.created_at, sort_by, sort_dir)
        orders = list(
            self.session.scalars(
                select(Order)
                .where(*conditions)
                .order_by(ordering, Order.id)
                .limit(limit)
                .offset(offset)
                .options(selectinload(Order.customer))
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
            .options(
                selectinload(Order.customer),
                selectinload(Order.line_items).selectinload(OrderLineItem.product),
            )
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
