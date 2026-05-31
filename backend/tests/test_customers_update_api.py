from fastapi.testclient import TestClient


def _create_customer(client: TestClient, headers: dict[str, str], **overrides: object) -> dict:
    payload = {
        "full_name": "Ada Lovelace",
        "email": "ada@example.com",
        "phone_number": "+91 98765 43210",
    }
    payload.update(overrides)
    response = client.post("/customers", headers=headers, json=payload)
    assert response.status_code == 201
    return response.json()


def test_update_customer_changes_fields(client: TestClient, auth_headers: dict[str, str]) -> None:
    customer = _create_customer(client, auth_headers)

    response = client.put(
        f"/customers/{customer['id']}",
        headers=auth_headers,
        json={"full_name": "  Ada King  ", "phone_number": " +91 90000 00000 "},
    )

    assert response.status_code == 200
    updated = response.json()
    assert updated["full_name"] == "Ada King"
    assert updated["phone_number"] == "+91 90000 00000"
    assert updated["email"] == "ada@example.com"


def test_update_customer_email_normalizes(client: TestClient, auth_headers: dict[str, str]) -> None:
    customer = _create_customer(client, auth_headers)

    response = client.put(
        f"/customers/{customer['id']}",
        headers=auth_headers,
        json={"email": " ADA.KING@Example.COM "},
    )

    assert response.status_code == 200
    assert response.json()["email"] == "ada.king@example.com"


def test_update_customer_duplicate_email_conflicts(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    _create_customer(client, auth_headers, email="first@example.com")
    second = _create_customer(client, auth_headers, email="second@example.com")

    response = client.put(
        f"/customers/{second['id']}",
        headers=auth_headers,
        json={"email": "first@example.com"},
    )

    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "duplicate_email"


def test_update_customer_not_found(client: TestClient, auth_headers: dict[str, str]) -> None:
    response = client.put(
        "/customers/00000000-0000-0000-0000-000000000000",
        headers=auth_headers,
        json={"full_name": "Ghost"},
    )

    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "customer_not_found"


def test_update_customer_requires_a_field(client: TestClient, auth_headers: dict[str, str]) -> None:
    customer = _create_customer(client, auth_headers)

    response = client.put(f"/customers/{customer['id']}", headers=auth_headers, json={})

    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "invalid_request"


def test_update_customer_requires_authentication(client: TestClient) -> None:
    response = client.put(
        "/customers/00000000-0000-0000-0000-000000000000",
        json={"full_name": "Ada"},
    )

    assert response.status_code == 401
