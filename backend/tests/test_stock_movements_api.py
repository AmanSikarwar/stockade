from fastapi.testclient import TestClient


def _product(client: TestClient, headers: dict[str, str], **overrides: object) -> dict:
    payload = {"name": "Widget", "sku": "W-1", "price": "10.00", "quantity_in_stock": 50}
    payload.update(overrides)
    response = client.post("/products", headers=headers, json=payload)
    assert response.status_code == 201
    return response.json()


def _customer(client: TestClient, headers: dict[str, str]) -> dict:
    return client.post(
        "/customers",
        headers=headers,
        json={"full_name": "Buyer", "email": "buyer@example.com", "phone_number": None},
    ).json()


def test_stock_movements_require_authentication(client: TestClient) -> None:
    response = client.get("/products/00000000-0000-0000-0000-000000000000/stock-movements")
    assert response.status_code == 401


def test_manual_adjustment_increases_stock_and_records_movement(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    product = _product(client, auth_headers, quantity_in_stock=50)

    response = client.post(
        f"/products/{product['id']}/adjust-stock",
        headers=auth_headers,
        json={"delta": 15, "reason": "restock", "note": "Received shipment"},
    )
    assert response.status_code == 200
    assert response.json()["quantity_in_stock"] == 65

    movements = client.get(
        f"/products/{product['id']}/stock-movements", headers=auth_headers
    ).json()
    assert movements["total"] == 1
    movement = movements["items"][0]
    assert movement["delta"] == 15
    assert movement["resulting_quantity"] == 65
    assert movement["reason"] == "restock"
    assert movement["note"] == "Received shipment"
    assert movement["reference_order_id"] is None


def test_manual_adjustment_decreases_stock(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    product = _product(client, auth_headers, quantity_in_stock=50)

    response = client.post(
        f"/products/{product['id']}/adjust-stock",
        headers=auth_headers,
        json={"delta": -10, "reason": "damage"},
    )
    assert response.status_code == 200
    assert response.json()["quantity_in_stock"] == 40


def test_adjustment_below_zero_is_rejected(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    product = _product(client, auth_headers, quantity_in_stock=5)

    response = client.post(
        f"/products/{product['id']}/adjust-stock",
        headers=auth_headers,
        json={"delta": -10, "reason": "correction"},
    )
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "invalid_adjustment"


def test_zero_delta_is_rejected(client: TestClient, auth_headers: dict[str, str]) -> None:
    product = _product(client, auth_headers)
    response = client.post(
        f"/products/{product['id']}/adjust-stock",
        headers=auth_headers,
        json={"delta": 0, "reason": "manual"},
    )
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "invalid_request"


def test_system_reason_cannot_be_used_manually(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    product = _product(client, auth_headers)
    response = client.post(
        f"/products/{product['id']}/adjust-stock",
        headers=auth_headers,
        json={"delta": 5, "reason": "order"},
    )
    # "order" is a system-only reason and is not part of the allowed manual literal.
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "invalid_request"


def test_adjust_unknown_product_returns_404(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    response = client.post(
        "/products/00000000-0000-0000-0000-000000000000/adjust-stock",
        headers=auth_headers,
        json={"delta": 5, "reason": "manual"},
    )
    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "product_not_found"


def test_order_lifecycle_records_movements(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    product = _product(client, auth_headers, quantity_in_stock=50)
    customer = _customer(client, auth_headers)

    order = client.post(
        "/orders",
        headers=auth_headers,
        json={
            "customer_id": customer["id"],
            "line_items": [{"product_id": product["id"], "quantity": 8}],
        },
    ).json()

    after_order = client.get(
        f"/products/{product['id']}/stock-movements", headers=auth_headers
    ).json()
    assert after_order["total"] == 1
    order_movement = after_order["items"][0]
    assert order_movement["delta"] == -8
    assert order_movement["resulting_quantity"] == 42
    assert order_movement["reason"] == "order"
    assert order_movement["reference_order_id"] == order["id"]

    assert client.delete(f"/orders/{order['id']}", headers=auth_headers).status_code == 204

    after_cancel = client.get(
        f"/products/{product['id']}/stock-movements", headers=auth_headers
    ).json()
    assert after_cancel["total"] == 2
    # Newest first: the cancellation restores stock.
    cancellation = after_cancel["items"][0]
    assert cancellation["delta"] == 8
    assert cancellation["resulting_quantity"] == 50
    assert cancellation["reason"] == "cancellation"
    assert cancellation["reference_order_id"] == order["id"]
