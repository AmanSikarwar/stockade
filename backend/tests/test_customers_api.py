from decimal import Decimal
from uuid import UUID

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.order import Order
from app.models.user import User


def test_customer_endpoints_require_authentication(client: TestClient) -> None:
    response = client.get("/customers")

    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "unauthorized"


def test_customer_crud_flow(client: TestClient, auth_headers: dict[str, str]) -> None:
    create_response = client.post(
        "/customers",
        headers=auth_headers,
        json={
            "full_name": "Ada Lovelace",
            "email": " ADA@Example.COM ",
            "phone_number": " +1 555 0100 ",
        },
    )
    assert create_response.status_code == 201
    created = create_response.json()
    customer_id = created["id"]
    assert created["full_name"] == "Ada Lovelace"
    assert created["email"] == "ada@example.com"
    assert created["phone_number"] == "+1 555 0100"

    list_response = client.get("/customers?q=ada", headers=auth_headers)
    assert list_response.status_code == 200
    listed = list_response.json()
    assert listed["total"] == 1
    assert listed["items"][0]["id"] == customer_id

    get_response = client.get(f"/customers/{customer_id}", headers=auth_headers)
    assert get_response.status_code == 200
    assert get_response.json()["id"] == customer_id

    delete_response = client.delete(f"/customers/{customer_id}", headers=auth_headers)
    assert delete_response.status_code == 204
    assert delete_response.content == b""

    deleted_get_response = client.get(f"/customers/{customer_id}", headers=auth_headers)
    assert deleted_get_response.status_code == 404


def test_duplicate_customer_email_returns_conflict(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    payload = {
        "full_name": "Ada Lovelace",
        "email": "ada@example.com",
        "phone_number": None,
    }
    assert client.post("/customers", headers=auth_headers, json=payload).status_code == 201

    duplicate_response = client.post(
        "/customers",
        headers=auth_headers,
        json={**payload, "email": " ADA@Example.COM "},
    )

    assert duplicate_response.status_code == 409
    assert duplicate_response.json()["detail"]["code"] == "duplicate_email"


def test_invalid_customer_request_returns_bad_request(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    response = client.post(
        "/customers",
        headers=auth_headers,
        json={
            "full_name": "Ada Lovelace",
            "email": "not-an-email",
            "phone_number": None,
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "invalid_request"


def test_delete_customer_with_orders_returns_conflict(
    client: TestClient,
    auth_headers: dict[str, str],
    db_session: Session,
    admin_user: User,
) -> None:
    create_response = client.post(
        "/customers",
        headers=auth_headers,
        json={
            "full_name": "Ada Lovelace",
            "email": "ada@example.com",
            "phone_number": None,
        },
    )
    customer_id = UUID(create_response.json()["id"])
    order = Order(
        organization_id=admin_user.organization_id,
        customer_id=customer_id,
        status="active",
        total_amount=Decimal("0.00"),
    )
    db_session.add(order)
    db_session.commit()

    delete_response = client.delete(f"/customers/{customer_id}", headers=auth_headers)

    assert delete_response.status_code == 409
    assert delete_response.json()["detail"]["code"] == "customer_delete_conflict"
