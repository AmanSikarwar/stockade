from decimal import Decimal
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.models.order import OrderLineItem
from app.models.product import Product
from app.repositories.base import OrganizationScopedRepository


class ProductRepository(OrganizationScopedRepository):
    def __init__(self, session: Session, organization_id: UUID) -> None:
        super().__init__(session, organization_id)

    def list(
        self,
        *,
        limit: int,
        offset: int,
        search: str | None,
        include_inactive: bool,
    ) -> tuple[list[Product], int]:
        conditions = [Product.organization_id == self.organization_id]
        if not include_inactive:
            conditions.append(Product.active.is_(True))
        if search:
            pattern = f"%{search}%"
            conditions.append(or_(Product.name.ilike(pattern), Product.sku.ilike(pattern)))

        total = self.session.scalar(select(func.count(Product.id)).where(*conditions)) or 0
        products = list(
            self.session.scalars(
                select(Product)
                .where(*conditions)
                .order_by(Product.created_at.desc(), Product.id)
                .limit(limit)
                .offset(offset)
            ).all()
        )
        return products, total

    def get_active_by_id(self, product_id: UUID) -> Product | None:
        return self.session.scalars(
            select(Product).where(
                Product.id == product_id,
                Product.organization_id == self.organization_id,
                Product.active.is_(True),
            )
        ).one_or_none()

    def get_by_sku(self, sku: str) -> Product | None:
        return self.session.scalars(
            select(Product).where(
                Product.organization_id == self.organization_id,
                Product.sku == sku,
            )
        ).one_or_none()

    def create(
        self,
        *,
        name: str,
        sku: str,
        price: Decimal,
        quantity_in_stock: int,
    ) -> Product:
        product = Product(
            organization_id=self.organization_id,
            name=name,
            sku=sku,
            price=price,
            quantity_in_stock=quantity_in_stock,
            active=True,
        )
        self.session.add(product)
        return product

    def has_order_references(self, product_id: UUID) -> bool:
        return bool(
            self.session.scalar(
                select(func.count(OrderLineItem.id)).where(OrderLineItem.product_id == product_id)
            )
        )
