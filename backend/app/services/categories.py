from collections.abc import Mapping
from dataclasses import dataclass
from typing import Any
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.category import Category
from app.repositories.categories import CategoryRepository


class CategoryError(Exception):
    """Base category-domain exception."""


class CategoryNotFoundError(CategoryError):
    pass


class DuplicateCategoryNameError(CategoryError):
    pass


class CategoryValidationError(CategoryError):
    pass


@dataclass(frozen=True)
class CategoryWithCount:
    category: Category
    product_count: int


class CategoryService:
    def __init__(self, session: Session, organization_id: UUID) -> None:
        self.session = session
        self.repository = CategoryRepository(session, organization_id)

    def create_category(self, *, name: str) -> Category:
        normalized = normalize_name(name)
        if self.repository.get_by_name(normalized) is not None:
            raise DuplicateCategoryNameError("Category name already exists")

        category = self.repository.create(name=normalized)
        return self._commit_and_refresh(category)

    def list_categories(
        self,
        *,
        limit: int,
        offset: int,
        search: str | None = None,
    ) -> tuple[list[CategoryWithCount], int]:
        normalized_search = search.strip() if search else None
        categories, total = self.repository.list(
            limit=limit, offset=offset, search=normalized_search
        )
        counts = self.repository.product_counts([category.id for category in categories])
        items = [
            CategoryWithCount(category=category, product_count=counts.get(category.id, 0))
            for category in categories
        ]
        return items, total

    def get_category(self, category_id: UUID) -> Category:
        category = self.repository.get_by_id(category_id)
        if category is None:
            raise CategoryNotFoundError("Category not found")
        return category

    def update_category(self, category_id: UUID, changes: Mapping[str, Any]) -> Category:
        if not changes:
            raise CategoryValidationError("At least one category field must be provided")

        category = self.get_category(category_id)
        if "name" in changes:
            normalized = normalize_name(changes["name"])
            existing = self.repository.get_by_name(normalized)
            if existing is not None and existing.id != category.id:
                raise DuplicateCategoryNameError("Category name already exists")
            category.name = normalized

        return self._commit_and_refresh(category)

    def delete_category(self, category_id: UUID) -> None:
        category = self.get_category(category_id)
        # Products keep their history; the FK is ON DELETE SET NULL so they become
        # uncategorized rather than blocking the delete.
        self.session.delete(category)
        self.session.commit()

    def _commit_and_refresh(self, category: Category) -> Category:
        try:
            self.session.commit()
        except IntegrityError as exc:
            self.session.rollback()
            raise DuplicateCategoryNameError("Category name already exists") from exc
        self.session.refresh(category)
        return category


def normalize_name(value: str) -> str:
    normalized = value.strip()
    if not normalized:
        raise CategoryValidationError("Category name is required")
    return normalized
