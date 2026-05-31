from collections.abc import Mapping
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.product import Product
from app.models.stock_movement import MANUAL_REASONS, StockMovement
from app.repositories.products import ProductRepository
from app.repositories.stock_movements import StockMovementRepository

MONEY_QUANT = Decimal("0.01")


class ProductError(Exception):
    """Base product-domain exception."""


class ProductNotFoundError(ProductError):
    pass


class DuplicateProductSkuError(ProductError):
    pass


class ProductValidationError(ProductError):
    pass


class ProductService:
    def __init__(self, session: Session, organization_id: UUID) -> None:
        self.session = session
        self.repository = ProductRepository(session, organization_id)
        self.movements = StockMovementRepository(session, organization_id)

    def create_product(
        self,
        *,
        name: str,
        sku: str,
        price: Decimal,
        quantity_in_stock: int,
        category_id: UUID | None = None,
        reorder_point: int | None = None,
    ) -> Product:
        values = {
            "name": normalize_name(name),
            "sku": normalize_sku(sku),
            "price": normalize_price(price),
            "quantity_in_stock": normalize_quantity(quantity_in_stock),
            "reorder_point": normalize_reorder_point(reorder_point),
            "category_id": self._validate_category(category_id),
        }
        if self.repository.get_by_sku(values["sku"]) is not None:
            raise DuplicateProductSkuError("Product SKU already exists")

        product = self.repository.create(**values)
        return self._commit_and_refresh(product)

    def _validate_category(self, category_id: UUID | None) -> UUID | None:
        if category_id is None:
            return None
        if self.repository.get_category(category_id) is None:
            raise ProductValidationError("Category not found")
        return category_id

    def list_products(
        self,
        *,
        limit: int,
        offset: int,
        search: str | None = None,
        include_inactive: bool = False,
        sort_by: str | None = None,
        sort_dir: str = "desc",
        category_id: UUID | None = None,
    ) -> tuple[list[Product], int]:
        normalized_search = search.strip() if search else None
        return self.repository.list(
            limit=limit,
            offset=offset,
            search=normalized_search,
            include_inactive=include_inactive,
            sort_by=sort_by,
            sort_dir=sort_dir,
            category_id=category_id,
        )

    def get_product(self, product_id: UUID) -> Product:
        product = self.repository.get_active_by_id(product_id)
        if product is None:
            raise ProductNotFoundError("Product not found")
        return product

    def update_product(self, product_id: UUID, changes: Mapping[str, Any]) -> Product:
        if not changes:
            raise ProductValidationError("At least one product field must be provided")

        product = self.get_product(product_id)
        normalized = normalize_product_changes(changes)

        if "sku" in normalized:
            existing = self.repository.get_by_sku(normalized["sku"])
            if existing is not None and existing.id != product.id:
                raise DuplicateProductSkuError("Product SKU already exists")

        if "category_id" in normalized:
            normalized["category_id"] = self._validate_category(normalized["category_id"])

        for field_name, value in normalized.items():
            setattr(product, field_name, value)

        return self._commit_and_refresh(product)

    def delete_product(self, product_id: UUID) -> None:
        product = self.get_product(product_id)
        product.active = False
        try:
            self.session.commit()
        except IntegrityError as exc:
            self.session.rollback()
            raise ProductValidationError("Product could not be deleted") from exc

    def adjust_stock(
        self,
        product_id: UUID,
        *,
        delta: int,
        reason: str = "manual",
        note: str | None = None,
    ) -> Product:
        delta = int(delta)
        if delta == 0:
            raise ProductValidationError("Stock adjustment delta must be non-zero")
        if reason not in MANUAL_REASONS:
            raise ProductValidationError("Invalid stock adjustment reason")

        try:
            product = self.repository.get_active_for_update(product_id)
            if product is None:
                raise ProductNotFoundError("Product not found")

            new_quantity = product.quantity_in_stock + delta
            if new_quantity < 0:
                raise ProductValidationError("Stock adjustment would make quantity negative")

            product.quantity_in_stock = new_quantity
            self.movements.record(
                product_id=product.id,
                delta=delta,
                resulting_quantity=new_quantity,
                reason=reason,
                note=(note.strip() or None) if note else None,
            )
            self.session.commit()
        except ProductError:
            self.session.rollback()
            raise
        except IntegrityError as exc:
            self.session.rollback()
            raise ProductValidationError("Stock adjustment could not be saved") from exc

        self.session.refresh(product)
        return product

    def list_stock_movements(
        self,
        product_id: UUID,
        *,
        limit: int,
        offset: int,
    ) -> tuple[list[StockMovement], int]:
        self.get_product(product_id)
        return self.movements.list_for_product(product_id=product_id, limit=limit, offset=offset)

    def _commit_and_refresh(self, product: Product) -> Product:
        try:
            self.session.commit()
        except IntegrityError as exc:
            self.session.rollback()
            raise DuplicateProductSkuError("Product SKU already exists") from exc
        self.session.refresh(product)
        return product


def normalize_product_changes(changes: Mapping[str, Any]) -> dict[str, Any]:
    normalized: dict[str, Any] = {}
    for field_name, value in changes.items():
        if field_name == "name":
            normalized[field_name] = normalize_name(value)
        elif field_name == "sku":
            normalized[field_name] = normalize_sku(value)
        elif field_name == "price":
            normalized[field_name] = normalize_price(value)
        elif field_name == "quantity_in_stock":
            normalized[field_name] = normalize_quantity(value)
        elif field_name == "reorder_point":
            normalized[field_name] = normalize_reorder_point(value)
        elif field_name == "category_id":
            normalized[field_name] = value
    return normalized


def normalize_name(value: str) -> str:
    normalized = value.strip()
    if not normalized:
        raise ProductValidationError("Product name is required")
    return normalized


def normalize_sku(value: str) -> str:
    normalized = value.strip().upper()
    if not normalized:
        raise ProductValidationError("Product SKU is required")
    return normalized


def normalize_price(value: Decimal) -> Decimal:
    price = Decimal(str(value))
    if price < 0:
        raise ProductValidationError("Product price must be non-negative")
    if price.as_tuple().exponent < -2:
        raise ProductValidationError("Product price can have at most two decimal places")
    return price.quantize(MONEY_QUANT)


def normalize_quantity(value: int) -> int:
    quantity = int(value)
    if quantity < 0:
        raise ProductValidationError("Product quantity must be non-negative")
    return quantity


def normalize_reorder_point(value: int | None) -> int | None:
    if value is None:
        return None
    point = int(value)
    if point < 0:
        raise ProductValidationError("Reorder point must be non-negative")
    return point
