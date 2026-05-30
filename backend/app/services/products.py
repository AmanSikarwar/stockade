from collections.abc import Mapping
from decimal import Decimal
from typing import Any
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.product import Product
from app.repositories.products import ProductRepository

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

    def create_product(
        self,
        *,
        name: str,
        sku: str,
        price: Decimal,
        quantity_in_stock: int,
    ) -> Product:
        values = {
            "name": normalize_name(name),
            "sku": normalize_sku(sku),
            "price": normalize_price(price),
            "quantity_in_stock": normalize_quantity(quantity_in_stock),
        }
        if self.repository.get_by_sku(values["sku"]) is not None:
            raise DuplicateProductSkuError("Product SKU already exists")

        product = self.repository.create(**values)
        return self._commit_and_refresh(product)

    def list_products(
        self,
        *,
        limit: int,
        offset: int,
        search: str | None = None,
        include_inactive: bool = False,
    ) -> tuple[list[Product], int]:
        normalized_search = search.strip() if search else None
        return self.repository.list(
            limit=limit,
            offset=offset,
            search=normalized_search,
            include_inactive=include_inactive,
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
