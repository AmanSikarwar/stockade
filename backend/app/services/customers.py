from collections.abc import Mapping
from typing import Any
from uuid import UUID

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.repositories.customers import CustomerRepository


class CustomerError(Exception):
    """Base customer-domain exception."""


class CustomerNotFoundError(CustomerError):
    pass


class DuplicateCustomerEmailError(CustomerError):
    pass


class CustomerDeleteConflictError(CustomerError):
    pass


class CustomerValidationError(CustomerError):
    pass


class CustomerService:
    def __init__(self, session: Session, organization_id: UUID) -> None:
        self.session = session
        self.repository = CustomerRepository(session, organization_id)

    def create_customer(
        self,
        *,
        full_name: str,
        email: str,
        phone_number: str | None,
    ) -> Customer:
        values = {
            "full_name": normalize_full_name(full_name),
            "email": normalize_email(email),
            "phone_number": normalize_phone_number(phone_number),
        }
        if self.repository.get_by_email(values["email"]) is not None:
            raise DuplicateCustomerEmailError("Customer email already exists")

        customer = self.repository.create(**values)
        return self._commit_and_refresh(customer)

    def list_customers(
        self,
        *,
        limit: int,
        offset: int,
        search: str | None = None,
        sort_by: str | None = None,
        sort_dir: str = "desc",
    ) -> tuple[list[Customer], int]:
        normalized_search = search.strip() if search else None
        return self.repository.list(
            limit=limit,
            offset=offset,
            search=normalized_search,
            sort_by=sort_by,
            sort_dir=sort_dir,
        )

    def get_customer(self, customer_id: UUID) -> Customer:
        customer = self.repository.get_by_id(customer_id)
        if customer is None:
            raise CustomerNotFoundError("Customer not found")
        return customer

    def update_customer(self, customer_id: UUID, changes: Mapping[str, Any]) -> Customer:
        if not changes:
            raise CustomerValidationError("At least one customer field must be provided")

        customer = self.get_customer(customer_id)
        normalized = normalize_customer_changes(changes)

        if "email" in normalized:
            existing = self.repository.get_by_email(normalized["email"])
            if existing is not None and existing.id != customer.id:
                raise DuplicateCustomerEmailError("Customer email already exists")

        for field_name, value in normalized.items():
            setattr(customer, field_name, value)

        return self._commit_and_refresh(customer)

    def delete_customer(self, customer_id: UUID) -> None:
        customer = self.get_customer(customer_id)
        if self.repository.has_orders(customer.id):
            raise CustomerDeleteConflictError("Customer has orders and cannot be deleted")

        self.session.delete(customer)
        try:
            self.session.commit()
        except IntegrityError as exc:
            self.session.rollback()
            raise CustomerDeleteConflictError("Customer has orders and cannot be deleted") from exc

    def _commit_and_refresh(self, customer: Customer) -> Customer:
        try:
            self.session.commit()
        except IntegrityError as exc:
            self.session.rollback()
            raise DuplicateCustomerEmailError("Customer email already exists") from exc
        self.session.refresh(customer)
        return customer


def normalize_customer_changes(changes: Mapping[str, Any]) -> dict[str, Any]:
    normalized: dict[str, Any] = {}
    for field_name, value in changes.items():
        if field_name == "full_name":
            normalized[field_name] = normalize_full_name(value)
        elif field_name == "email":
            normalized[field_name] = normalize_email(value)
        elif field_name == "phone_number":
            normalized[field_name] = normalize_phone_number(value)
    return normalized


def normalize_full_name(value: str) -> str:
    normalized = value.strip()
    if not normalized:
        raise CustomerValidationError("Customer name is required")
    return normalized


def normalize_email(value: str) -> str:
    normalized = value.strip().lower()
    if not normalized:
        raise CustomerValidationError("Customer email is required")
    return normalized


def normalize_phone_number(value: str | None) -> str | None:
    if value is None:
        return None

    normalized = value.strip()
    return normalized or None
