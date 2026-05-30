from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal
from threading import Barrier
from uuid import UUID, uuid4

import pytest
from sqlalchemy import func, select
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

from app.models.order import Order
from app.models.organization import Organization
from app.models.product import Product
from app.services.customers import CustomerService
from app.services.orders import (
    InsufficientStockError,
    OrderCustomerNotFoundError,
    OrderLineInput,
    OrderProductNotFoundError,
    OrderService,
)
from app.services.products import ProductService


def test_create_order_decrements_stock_and_computes_totals(
    db_session: Session,
    organization: Organization,
) -> None:
    customer_id = create_customer(db_session, organization.id)
    tape = create_product(
        db_session, organization.id, sku="TAPE-001", price=Decimal("3.25"), stock=10
    )
    box = create_product(db_session, organization.id, sku="BOX-001", price=Decimal("2.00"), stock=5)

    order = OrderService(db_session, organization.id).create_order(
        customer_id=customer_id,
        line_items=[
            OrderLineInput(product_id=tape.id, quantity=2),
            OrderLineInput(product_id=box.id, quantity=2),
        ],
    )

    assert order.status == "active"
    assert order.total_amount == Decimal("10.50")
    assert len(order.line_items) == 2
    line_items_by_product = {line_item.product_id: line_item for line_item in order.line_items}
    assert line_items_by_product[tape.id].unit_price == Decimal("3.25")
    assert line_items_by_product[tape.id].line_total == Decimal("6.50")
    assert line_items_by_product[box.id].unit_price == Decimal("2.00")
    assert line_items_by_product[box.id].line_total == Decimal("4.00")
    assert db_session.get(Product, tape.id).quantity_in_stock == 8
    assert db_session.get(Product, box.id).quantity_in_stock == 3


def test_duplicate_line_items_are_aggregated(
    db_session: Session,
    organization: Organization,
) -> None:
    customer_id = create_customer(db_session, organization.id)
    tape = create_product(
        db_session, organization.id, sku="TAPE-001", price=Decimal("3.25"), stock=5
    )

    order = OrderService(db_session, organization.id).create_order(
        customer_id=customer_id,
        line_items=[
            OrderLineInput(product_id=tape.id, quantity=2),
            OrderLineInput(product_id=tape.id, quantity=3),
        ],
    )

    assert len(order.line_items) == 1
    assert order.line_items[0].quantity_ordered == 5
    assert order.total_amount == Decimal("16.25")
    assert db_session.get(Product, tape.id).quantity_in_stock == 0


def test_insufficient_stock_rejects_order_atomically(
    db_session: Session,
    organization: Organization,
) -> None:
    customer_id = create_customer(db_session, organization.id)
    tape = create_product(
        db_session, organization.id, sku="TAPE-001", price=Decimal("3.25"), stock=10
    )
    box = create_product(db_session, organization.id, sku="BOX-001", price=Decimal("2.00"), stock=1)

    with pytest.raises(InsufficientStockError) as exc_info:
        OrderService(db_session, organization.id).create_order(
            customer_id=customer_id,
            line_items=[
                OrderLineInput(product_id=tape.id, quantity=2),
                OrderLineInput(product_id=box.id, quantity=2),
            ],
        )

    assert exc_info.value.shortfalls[0].product_id == box.id
    assert db_session.scalar(select(func.count(Order.id))) == 0
    assert db_session.get(Product, tape.id).quantity_in_stock == 10
    assert db_session.get(Product, box.id).quantity_in_stock == 1


def test_order_rejects_missing_customer_and_inactive_product(
    db_session: Session,
    organization: Organization,
) -> None:
    customer_id = create_customer(db_session, organization.id)
    tape = create_product(
        db_session, organization.id, sku="TAPE-001", price=Decimal("3.25"), stock=10
    )
    ProductService(db_session, organization.id).delete_product(tape.id)

    with pytest.raises(OrderCustomerNotFoundError):
        OrderService(db_session, organization.id).create_order(
            customer_id=UUID("00000000-0000-0000-0000-000000000001"),
            line_items=[OrderLineInput(product_id=tape.id, quantity=1)],
        )

    with pytest.raises(OrderProductNotFoundError):
        OrderService(db_session, organization.id).create_order(
            customer_id=customer_id,
            line_items=[OrderLineInput(product_id=tape.id, quantity=1)],
        )


def test_order_line_keeps_price_snapshot(
    db_session: Session,
    organization: Organization,
) -> None:
    customer_id = create_customer(db_session, organization.id)
    tape = create_product(
        db_session, organization.id, sku="TAPE-001", price=Decimal("3.25"), stock=10
    )
    order = OrderService(db_session, organization.id).create_order(
        customer_id=customer_id,
        line_items=[OrderLineInput(product_id=tape.id, quantity=2)],
    )

    tape.price = Decimal("9.99")
    db_session.commit()
    refreshed_order = OrderService(db_session, organization.id).get_order(order.id)

    assert refreshed_order.line_items[0].unit_price == Decimal("3.25")
    assert refreshed_order.line_items[0].line_total == Decimal("6.50")
    assert refreshed_order.total_amount == Decimal("6.50")


def test_cancel_order_restores_stock_and_marks_cancelled(
    db_session: Session,
    organization: Organization,
) -> None:
    customer_id = create_customer(db_session, organization.id)
    tape = create_product(
        db_session, organization.id, sku="TAPE-001", price=Decimal("3.25"), stock=10
    )
    order_service = OrderService(db_session, organization.id)
    order = order_service.create_order(
        customer_id=customer_id,
        line_items=[OrderLineInput(product_id=tape.id, quantity=4)],
    )
    assert db_session.get(Product, tape.id).quantity_in_stock == 6

    order_service.cancel_order(order.id)

    cancelled = order_service.get_order(order.id)
    assert cancelled.status == "cancelled"
    assert db_session.get(Product, tape.id).quantity_in_stock == 10


def test_cancel_order_is_idempotent(
    db_session: Session,
    organization: Organization,
) -> None:
    customer_id = create_customer(db_session, organization.id)
    tape = create_product(
        db_session, organization.id, sku="TAPE-001", price=Decimal("3.25"), stock=10
    )
    order_service = OrderService(db_session, organization.id)
    order = order_service.create_order(
        customer_id=customer_id,
        line_items=[OrderLineInput(product_id=tape.id, quantity=4)],
    )

    order_service.cancel_order(order.id)
    order_service.cancel_order(order.id)

    assert db_session.get(Product, tape.id).quantity_in_stock == 10


def test_concurrent_orders_cannot_oversell(test_engine: Engine) -> None:
    session_factory = sessionmaker(
        bind=test_engine,
        class_=Session,
        autoflush=False,
        expire_on_commit=False,
    )
    test_suffix = uuid4()
    with session_factory() as setup_session:
        organization = Organization(display_name=f"Concurrent Test {test_suffix}")
        setup_session.add(organization)
        setup_session.commit()
        setup_session.refresh(organization)
        organization_id = organization.id
        customer_id = (
            CustomerService(setup_session, organization_id)
            .create_customer(
                full_name="Ada Lovelace",
                email=f"ada-{test_suffix}@example.com",
                phone_number=None,
            )
            .id
        )
        product_id = (
            ProductService(setup_session, organization_id)
            .create_product(
                name="Limited Tape",
                sku=f"TAPE-{test_suffix}",
                price=Decimal("3.25"),
                quantity_in_stock=1,
            )
            .id
        )

    start_line = Barrier(2)

    def place_order() -> str:
        with session_factory() as order_session:
            start_line.wait(timeout=10)
            try:
                OrderService(order_session, organization_id).create_order(
                    customer_id=customer_id,
                    line_items=[OrderLineInput(product_id=product_id, quantity=1)],
                )
            except InsufficientStockError:
                return "insufficient"
            return "placed"

    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = [executor.submit(place_order) for _ in range(2)]
        results = sorted(future.result(timeout=15) for future in futures)

    with session_factory() as verify_session:
        product = verify_session.get(Product, product_id)
        successful_orders = verify_session.scalar(
            select(func.count(Order.id)).where(
                Order.organization_id == organization_id,
                Order.customer_id == customer_id,
            )
        )

    assert results == ["insufficient", "placed"]
    assert product is not None
    assert product.quantity_in_stock == 0
    assert successful_orders == 1


def create_customer(db_session: Session, organization_id: UUID) -> UUID:
    customer = CustomerService(db_session, organization_id).create_customer(
        full_name="Ada Lovelace",
        email=f"ada-{organization_id}@example.com",
        phone_number=None,
    )
    return customer.id


def create_product(
    db_session: Session,
    organization_id: UUID,
    *,
    sku: str,
    price: Decimal,
    stock: int,
) -> Product:
    return ProductService(db_session, organization_id).create_product(
        name=sku,
        sku=sku,
        price=price,
        quantity_in_stock=stock,
    )
