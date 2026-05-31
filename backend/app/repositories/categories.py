from collections.abc import Sequence
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.category import Category
from app.models.product import Product
from app.repositories.base import OrganizationScopedRepository


class CategoryRepository(OrganizationScopedRepository):
    def __init__(self, session: Session, organization_id: UUID) -> None:
        super().__init__(session, organization_id)

    def list(
        self,
        *,
        limit: int,
        offset: int,
        search: str | None = None,
    ) -> tuple[list[Category], int]:
        conditions = [Category.organization_id == self.organization_id]
        if search:
            conditions.append(Category.name.ilike(f"%{search}%"))

        total = self.session.scalar(select(func.count(Category.id)).where(*conditions)) or 0
        categories = list(
            self.session.scalars(
                select(Category)
                .where(*conditions)
                .order_by(Category.name.asc(), Category.id)
                .limit(limit)
                .offset(offset)
            ).all()
        )
        return categories, total

    def get_by_id(self, category_id: UUID) -> Category | None:
        return self.session.scalars(
            select(Category).where(
                Category.id == category_id,
                Category.organization_id == self.organization_id,
            )
        ).one_or_none()

    def get_by_name(self, name: str) -> Category | None:
        return self.session.scalars(
            select(Category).where(
                Category.organization_id == self.organization_id,
                Category.name == name,
            )
        ).one_or_none()

    def create(self, *, name: str) -> Category:
        category = Category(organization_id=self.organization_id, name=name)
        self.session.add(category)
        return category

    def product_count(self, category_id: UUID) -> int:
        return (
            self.session.scalar(
                select(func.count(Product.id)).where(
                    Product.organization_id == self.organization_id,
                    Product.category_id == category_id,
                )
            )
            or 0
        )

    def product_counts(self, category_ids: Sequence[UUID]) -> dict[UUID, int]:
        if not category_ids:
            return {}
        rows = self.session.execute(
            select(Product.category_id, func.count(Product.id))
            .where(
                Product.organization_id == self.organization_id,
                Product.category_id.in_(category_ids),
            )
            .group_by(Product.category_id)
        ).all()
        return {category_id: count for category_id, count in rows}
