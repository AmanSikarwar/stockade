from fastapi.testclient import TestClient


def test_product_endpoints_require_authentication(client: TestClient) -> None:
    response = client.get("/products")

    assert response.status_code == 401
    assert response.json()["detail"] == "Could not validate credentials"


def test_product_crud_flow(client: TestClient, auth_headers: dict[str, str]) -> None:
    create_response = client.post(
        "/products",
        headers=auth_headers,
        json={
            "name": "Packing Tape",
            "sku": " tape-001 ",
            "price": "4.50",
            "quantity_in_stock": 12,
        },
    )
    assert create_response.status_code == 201
    created = create_response.json()
    product_id = created["id"]
    assert created["sku"] == "TAPE-001"
    assert created["price"] == "4.50"
    assert created["active"] is True

    list_response = client.get("/products", headers=auth_headers)
    assert list_response.status_code == 200
    listed = list_response.json()
    assert listed["total"] == 1
    assert listed["items"][0]["id"] == product_id

    get_response = client.get(f"/products/{product_id}", headers=auth_headers)
    assert get_response.status_code == 200
    assert get_response.json()["id"] == product_id

    update_response = client.put(
        f"/products/{product_id}",
        headers=auth_headers,
        json={"name": "Premium Packing Tape", "quantity_in_stock": 8},
    )
    assert update_response.status_code == 200
    updated = update_response.json()
    assert updated["name"] == "Premium Packing Tape"
    assert updated["quantity_in_stock"] == 8

    delete_response = client.delete(f"/products/{product_id}", headers=auth_headers)
    assert delete_response.status_code == 204
    assert delete_response.content == b""

    deleted_get_response = client.get(f"/products/{product_id}", headers=auth_headers)
    assert deleted_get_response.status_code == 404

    active_list_response = client.get("/products", headers=auth_headers)
    assert active_list_response.json()["total"] == 0

    inactive_list_response = client.get(
        "/products?include_inactive=true",
        headers=auth_headers,
    )
    inactive_payload = inactive_list_response.json()
    assert inactive_payload["total"] == 1
    assert inactive_payload["items"][0]["active"] is False


def test_duplicate_product_sku_returns_conflict(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    payload = {
        "name": "Packing Tape",
        "sku": "TAPE-001",
        "price": "4.50",
        "quantity_in_stock": 12,
    }
    assert client.post("/products", headers=auth_headers, json=payload).status_code == 201

    duplicate_response = client.post(
        "/products",
        headers=auth_headers,
        json={**payload, "sku": " tape-001 "},
    )

    assert duplicate_response.status_code == 409
    assert duplicate_response.json()["detail"]["code"] == "duplicate_sku"


def test_invalid_product_request_returns_bad_request(
    client: TestClient,
    auth_headers: dict[str, str],
) -> None:
    create_response = client.post(
        "/products",
        headers=auth_headers,
        json={
            "name": "",
            "sku": "BAD-001",
            "price": "-1.00",
            "quantity_in_stock": 0,
        },
    )

    assert create_response.status_code == 400
    assert create_response.json()["detail"]["code"] == "invalid_request"

    product_response = client.post(
        "/products",
        headers=auth_headers,
        json={
            "name": "Packing Tape",
            "sku": "TAPE-001",
            "price": "4.50",
            "quantity_in_stock": 12,
        },
    )
    product_id = product_response.json()["id"]

    update_response = client.put(f"/products/{product_id}", headers=auth_headers, json={})

    assert update_response.status_code == 400
    assert update_response.json()["detail"]["code"] == "invalid_request"
