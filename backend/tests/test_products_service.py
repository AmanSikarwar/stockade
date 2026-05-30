from decimal import Decimal

import pytest
from sqlalchemy.orm import Session

from app.models.customer import Customer
from app.models.order import Order, OrderLineItem
from app.models.organization import Organization
from app.models.product import Product
from app.services.products import DuplicateProductSkuError, ProductNotFoundError, ProductService


def test_create_product_normalizes_values(
    db_session: Session,
    organization: Organization,
) -> None:
    service = ProductService(db_session, organization.id)

    product = service.create_product(
        name="  Packing Tape  ",
        sku=" tape-001 ",
        price=Decimal("4.5"),
        quantity_in_stock=12,
    )

    assert product.name == "Packing Tape"
    assert product.sku == "TAPE-001"
    assert product.price == Decimal("4.50")
    assert product.quantity_in_stock == 12
    assert product.active is True


def test_duplicate_sku_is_rejected_within_organization(
    db_session: Session,
    organization: Organization,
) -> None:
    service = ProductService(db_session, organization.id)
    service.create_product(
        name="Packing Tape",
        sku="TAPE-001",
        price=Decimal("4.50"),
        quantity_in_stock=12,
    )

    with pytest.raises(DuplicateProductSkuError):
        service.create_product(
            name="Different Tape",
            sku=" tape-001 ",
            price=Decimal("5.00"),
            quantity_in_stock=3,
        )


def test_same_sku_is_allowed_across_organizations(
    db_session: Session,
    organization: Organization,
) -> None:
    other_organization = Organization(display_name="Other Organization")
    db_session.add(other_organization)
    db_session.commit()
    db_session.refresh(other_organization)

    ProductService(db_session, organization.id).create_product(
        name="Packing Tape",
        sku="TAPE-001",
        price=Decimal("4.50"),
        quantity_in_stock=12,
    )

    product = ProductService(db_session, other_organization.id).create_product(
        name="Packing Tape",
        sku="TAPE-001",
        price=Decimal("4.50"),
        quantity_in_stock=12,
    )

    assert product.organization_id == other_organization.id


def test_delete_product_soft_deletes_and_hides_from_active_reads(
    db_session: Session,
    organization: Organization,
) -> None:
    service = ProductService(db_session, organization.id)
    product = service.create_product(
        name="Packing Tape",
        sku="TAPE-001",
        price=Decimal("4.50"),
        quantity_in_stock=12,
    )

    service.delete_product(product.id)

    stored = db_session.get(Product, product.id)
    assert stored is not None
    assert stored.active is False

    with pytest.raises(ProductNotFoundError):
        service.get_product(product.id)

    active_products, active_total = service.list_products(limit=50, offset=0)
    all_products, all_total = service.list_products(limit=50, offset=0, include_inactive=True)

    assert active_products == []
    assert active_total == 0
    assert all_products == [stored]
    assert all_total == 1


def test_delete_referenced_product_preserves_order_line(
    db_session: Session,
    organization: Organization,
) -> None:
    service = ProductService(db_session, organization.id)
    product = service.create_product(
        name="Packing Tape",
        sku="TAPE-001",
        price=Decimal("4.50"),
        quantity_in_stock=12,
    )
    customer = Customer(
        organization_id=organization.id,
        full_name="Ada Lovelace",
        email="ada@example.com",
        phone_number=None,
    )
    order = Order(
        organization_id=organization.id,
        customer=customer,
        status="active",
        total_amount=Decimal("9.00"),
    )
    line_item = OrderLineItem(
        order=order,
        product=product,
        quantity_ordered=2,
        unit_price=Decimal("4.50"),
        line_total=Decimal("9.00"),
    )
    db_session.add_all([customer, order, line_item])
    db_session.commit()

    service.delete_product(product.id)

    stored = db_session.get(Product, product.id)
    stored_line_item = db_session.get(OrderLineItem, line_item.id)
    assert stored is not None
    assert stored.active is False
    assert stored_line_item is not None
    assert stored_line_item.product_id == product.id
