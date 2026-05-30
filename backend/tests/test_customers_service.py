from decimal import Decimal

import pytest
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.order import Order
from app.models.organization import Organization
from app.services.customers import (
    CustomerDeleteConflictError,
    CustomerNotFoundError,
    CustomerService,
    DuplicateCustomerEmailError,
)


def test_create_customer_normalizes_values(
    db_session: Session,
    organization: Organization,
) -> None:
    service = CustomerService(db_session, organization.id)

    customer = service.create_customer(
        full_name="  Ada Lovelace  ",
        email=" ADA@Example.COM ",
        phone_number="  +1 555 0100  ",
    )

    assert customer.full_name == "Ada Lovelace"
    assert customer.email == "ada@example.com"
    assert customer.phone_number == "+1 555 0100"


def test_blank_phone_number_is_stored_as_none(
    db_session: Session,
    organization: Organization,
) -> None:
    customer = CustomerService(db_session, organization.id).create_customer(
        full_name="Ada Lovelace",
        email="ada@example.com",
        phone_number="   ",
    )

    assert customer.phone_number is None


def test_duplicate_email_is_rejected_within_organization(
    db_session: Session,
    organization: Organization,
) -> None:
    service = CustomerService(db_session, organization.id)
    service.create_customer(
        full_name="Ada Lovelace",
        email="ada@example.com",
        phone_number=None,
    )

    with pytest.raises(DuplicateCustomerEmailError):
        service.create_customer(
            full_name="Ada Byron",
            email=" ADA@Example.COM ",
            phone_number=None,
        )


def test_same_email_is_allowed_across_organizations(
    db_session: Session,
    organization: Organization,
) -> None:
    other_organization = Organization(display_name="Other Organization")
    db_session.add(other_organization)
    db_session.commit()
    db_session.refresh(other_organization)

    CustomerService(db_session, organization.id).create_customer(
        full_name="Ada Lovelace",
        email="ada@example.com",
        phone_number=None,
    )

    customer = CustomerService(db_session, other_organization.id).create_customer(
        full_name="Ada Lovelace",
        email="ada@example.com",
        phone_number=None,
    )

    assert customer.organization_id == other_organization.id


def test_delete_customer_removes_unreferenced_customer(
    db_session: Session,
    organization: Organization,
) -> None:
    service = CustomerService(db_session, organization.id)
    customer = service.create_customer(
        full_name="Ada Lovelace",
        email="ada@example.com",
        phone_number=None,
    )

    service.delete_customer(customer.id)

    assert db_session.get(Customer, customer.id) is None
    with pytest.raises(CustomerNotFoundError):
        service.get_customer(customer.id)


def test_delete_customer_is_guarded_when_orders_exist(
    db_session: Session,
    organization: Organization,
) -> None:
    service = CustomerService(db_session, organization.id)
    customer = service.create_customer(
        full_name="Ada Lovelace",
        email="ada@example.com",
        phone_number=None,
    )
    order = Order(
        organization_id=organization.id,
        customer_id=customer.id,
        status="active",
        total_amount=Decimal("0.00"),
    )
    db_session.add(order)
    db_session.commit()

    with pytest.raises(CustomerDeleteConflictError):
        service.delete_customer(customer.id)

    assert db_session.get(Customer, customer.id) is not None
    assert db_session.get(Order, order.id) is not None
