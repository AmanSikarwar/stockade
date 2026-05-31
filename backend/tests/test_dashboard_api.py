from decimal import Decimal
from uuid import UUID

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User
from app.services.customers import CustomerService
from app.services.orders import OrderLineInput, OrderService
from app.services.products import ProductService


def test_dashboard_requires_authentication(client: TestClient) -> None:
    response = client.get("/dashboard")

    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "unauthorized"


def test_dashboard_returns_metrics_and_low_stock_products(
    client: TestClient,
    auth_headers: dict[str, str],
    db_session: Session,
    admin_user: User,
) -> None:
    customer_id = create_customer(db_session, admin_user.organization_id)
    low = create_product(
        db_session,
        admin_user.organization_id,
        sku="LOW-001",
        price=Decimal("3.25"),
        stock=2,
    )
    create_product(
        db_session,
        admin_user.organization_id,
        sku="EDGE-001",
        price=Decimal("2.00"),
        stock=5,
    )
    healthy = create_product(
        db_session,
        admin_user.organization_id,
        sku="HEALTHY-001",
        price=Decimal("9.00"),
        stock=20,
    )
    inactive_low = create_product(
        db_session,
        admin_user.organization_id,
        sku="INACTIVE-001",
        price=Decimal("1.00"),
        stock=1,
    )
    ProductService(db_session, admin_user.organization_id).delete_product(inactive_low.id)

    order_service = OrderService(db_session, admin_user.organization_id)
    active_order = order_service.create_order(
        customer_id=customer_id,
        line_items=[OrderLineInput(product_id=healthy.id, quantity=1)],
    )
    cancelled_order = order_service.create_order(
        customer_id=customer_id,
        line_items=[OrderLineInput(product_id=healthy.id, quantity=1)],
    )
    order_service.cancel_order(cancelled_order.id)

    response = client.get("/dashboard?low_stock_limit=1", headers=auth_headers)

    assert response.status_code == 200
    payload = response.json()
    assert payload["total_products"] == 4
    assert payload["total_active_products"] == 3
    assert payload["total_customers"] == 1
    assert payload["total_orders"] == 2
    assert payload["total_active_orders"] == 1
    assert payload["total_cancelled_orders"] == 1
    assert payload["low_stock_threshold"] == 5
    assert payload["low_stock_products_count"] == 2
    assert payload["low_stock_products"] == [
        {
            "id": str(low.id),
            "name": "LOW-001",
            "sku": "LOW-001",
            "price": "3.25",
            "quantity_in_stock": 2,
            "reorder_point": None,
        }
    ]
    assert active_order.status == "active"


def test_openapi_includes_dashboard_and_filtered_order_parameters(
    client: TestClient,
) -> None:
    response = client.get("/openapi.json")

    assert response.status_code == 200
    openapi = response.json()
    assert "/dashboard" in openapi["paths"]
    order_parameters = openapi["paths"]["/orders"]["get"]["parameters"]
    assert {parameter["name"] for parameter in order_parameters} >= {
        "limit",
        "offset",
        "status",
        "customer_id",
    }


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
):
    return ProductService(db_session, organization_id).create_product(
        name=sku,
        sku=sku,
        price=price,
        quantity_in_stock=stock,
    )
