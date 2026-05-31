from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.order import Order
from app.repositories.base import OrganizationScopedRepository, resolve_order

CUSTOMER_SORTS = {
    "created_at": Customer.created_at,
    "full_name": Customer.full_name,
    "email": Customer.email,
}


class CustomerRepository(OrganizationScopedRepository):
    def __init__(self, session: Session, organization_id: UUID) -> None:
        super().__init__(session, organization_id)

    def list(
        self,
        *,
        limit: int,
        offset: int,
        search: str | None,
        sort_by: str | None = None,
        sort_dir: str = "desc",
    ) -> tuple[list[Customer], int]:
        conditions = [Customer.organization_id == self.organization_id]
        if search:
            pattern = f"%{search}%"
            conditions.append(or_(Customer.full_name.ilike(pattern), Customer.email.ilike(pattern)))

        total = self.session.scalar(select(func.count(Customer.id)).where(*conditions)) or 0
        ordering = resolve_order(CUSTOMER_SORTS, Customer.created_at, sort_by, sort_dir)
        customers = list(
            self.session.scalars(
                select(Customer)
                .where(*conditions)
                .order_by(ordering, Customer.id)
                .limit(limit)
                .offset(offset)
            ).all()
        )
        return customers, total

    def get_by_id(self, customer_id: UUID) -> Customer | None:
        return self.session.scalars(
            select(Customer).where(
                Customer.id == customer_id,
                Customer.organization_id == self.organization_id,
            )
        ).one_or_none()

    def get_by_email(self, email: str) -> Customer | None:
        return self.session.scalars(
            select(Customer).where(
                Customer.organization_id == self.organization_id,
                Customer.email == email,
            )
        ).one_or_none()

    def create(self, *, full_name: str, email: str, phone_number: str | None) -> Customer:
        customer = Customer(
            organization_id=self.organization_id,
            full_name=full_name,
            email=email,
            phone_number=phone_number,
        )
        self.session.add(customer)
        return customer

    def has_orders(self, customer_id: UUID) -> bool:
        return bool(
            self.session.scalar(
                select(func.count(Order.id)).where(
                    Order.organization_id == self.organization_id,
                    Order.customer_id == customer_id,
                )
            )
        )
