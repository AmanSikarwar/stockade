from decimal import Decimal
from uuid import UUID

from fastapi.testclient import TestClient
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models.order import Order
from app.models.product import Product
from app.models.user import User
from app.services.customers import CustomerService
from app.services.products import ProductService


def test_order_endpoints_require_authentication(client: TestClient) -> None:
    response = client.get("/orders")

    assert response.status_code == 401
    assert response.json()["detail"] == "Could not validate credentials"


def test_order_create_get_list_and_cancel_flow(
    client: TestClient,
    auth_headers: dict[str, str],
    db_session: Session,
    admin_user: User,
) -> None:
    customer_id = create_customer(db_session, admin_user.organization_id)
    tape = create_product(
        db_session,
        admin_user.organization_id,
        sku="TAPE-001",
        price=Decimal("3.25"),
        stock=10,
    )

    create_response = client.post(
        "/orders",
        headers=auth_headers,
        json={
            "customer_id": str(customer_id),
            "total_amount": "999.99",
            "line_items": [{"product_id": str(tape.id), "quantity": 2}],
        },
    )
    assert create_response.status_code == 201
    created = create_response.json()
    order_id = created["id"]
    assert created["status"] == "active"
    assert created["total_amount"] == "6.50"
    assert created["line_items"][0]["unit_price"] == "3.25"
    assert db_session.get(Product, tape.id).quantity_in_stock == 8

    list_response = client.get("/orders", headers=auth_headers)
    assert list_response.status_code == 200
    listed = list_response.json()
    assert listed["total"] == 1
    assert listed["items"][0]["id"] == order_id

    get_response = client.get(f"/orders/{order_id}", headers=auth_headers)
    assert get_response.status_code == 200
    assert get_response.json()["line_items"][0]["product_sku"] == "TAPE-001"

    cancel_response = client.delete(f"/orders/{order_id}", headers=auth_headers)
    assert cancel_response.status_code == 204
    assert cancel_response.content == b""
    assert db_session.get(Product, tape.id).quantity_in_stock == 10
    assert db_session.get(Order, UUID(order_id)).status == "cancelled"


def test_order_insufficient_stock_returns_conflict_and_keeps_inventory(
    client: TestClient,
    auth_headers: dict[str, str],
    db_session: Session,
    admin_user: User,
) -> None:
    customer_id = create_customer(db_session, admin_user.organization_id)
    tape = create_product(
        db_session,
        admin_user.organization_id,
        sku="TAPE-001",
        price=Decimal("3.25"),
        stock=1,
    )

    response = client.post(
        "/orders",
        headers=auth_headers,
        json={
            "customer_id": str(customer_id),
            "line_items": [{"product_id": str(tape.id), "quantity": 2}],
        },
    )

    assert response.status_code == 409
    payload = response.json()
    assert payload["detail"]["code"] == "insufficient_stock"
    assert payload["detail"]["shortfalls"] == [
        {"product_id": str(tape.id), "requested": 2, "available": 1}
    ]
    assert db_session.get(Product, tape.id).quantity_in_stock == 1
    assert db_session.scalar(select(func.count(Order.id))) == 0


def test_order_create_rejects_missing_customer_and_product(
    client: TestClient,
    auth_headers: dict[str, str],
    db_session: Session,
    admin_user: User,
) -> None:
    customer_id = create_customer(db_session, admin_user.organization_id)
    tape = create_product(
        db_session,
        admin_user.organization_id,
        sku="TAPE-001",
        price=Decimal("3.25"),
        stock=1,
    )

    missing_customer_response = client.post(
        "/orders",
        headers=auth_headers,
        json={
            "customer_id": "00000000-0000-0000-0000-000000000001",
            "line_items": [{"product_id": str(tape.id), "quantity": 1}],
        },
    )
    assert missing_customer_response.status_code == 404
    assert missing_customer_response.json()["detail"]["code"] == "customer_not_found"

    missing_product_response = client.post(
        "/orders",
        headers=auth_headers,
        json={
            "customer_id": str(customer_id),
            "line_items": [{"product_id": "00000000-0000-0000-0000-000000000002", "quantity": 1}],
        },
    )
    assert missing_product_response.status_code == 404
    assert missing_product_response.json()["detail"]["code"] == "product_not_found"


def test_invalid_order_request_returns_bad_request(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    response = client.post(
        "/orders",
        headers=auth_headers,
        json={
            "customer_id": "00000000-0000-0000-0000-000000000001",
            "line_items": [],
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "invalid_request"


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
