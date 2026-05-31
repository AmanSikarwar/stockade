from fastapi.testclient import TestClient


def _product(client: TestClient, headers: dict[str, str], sku: str, price: str, qty: int) -> dict:
    return client.post(
        "/products",
        headers=headers,
        json={"name": f"Item {sku}", "sku": sku, "price": price, "quantity_in_stock": qty},
    ).json()


def _customer(client: TestClient, headers: dict[str, str], name: str, email: str) -> dict:
    return client.post(
        "/customers",
        headers=headers,
        json={"full_name": name, "email": email, "phone_number": None},
    ).json()


def _order(
    client: TestClient, headers: dict[str, str], customer_id: str, lines: list[dict]
) -> dict:
    response = client.post(
        "/orders",
        headers=headers,
        json={"customer_id": customer_id, "line_items": lines},
    )
    assert response.status_code == 201
    return response.json()


def test_reports_require_authentication(client: TestClient) -> None:
    assert client.get("/reports/revenue-over-time").status_code == 401
    assert client.get("/reports/top-products").status_code == 401
    assert client.get("/reports/sales-by-customer").status_code == 401


def test_revenue_over_time_fills_window_and_sums_active_orders(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    product = _product(client, auth_headers, "W-1", "10.00", 100)
    customer = _customer(client, auth_headers, "Buyer", "buyer@example.com")
    _order(client, auth_headers, customer["id"], [{"product_id": product["id"], "quantity": 3}])
    cancelled = _order(
        client, auth_headers, customer["id"], [{"product_id": product["id"], "quantity": 2}]
    )
    assert client.delete(f"/orders/{cancelled['id']}", headers=auth_headers).status_code == 204

    response = client.get("/reports/revenue-over-time?days=7", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["days"] == 7
    assert len(body["points"]) == 7
    # Only the active order counts: 3 * 10.00 = 30.00. The cancelled one is excluded.
    assert body["total_revenue"] == "30.00"
    assert body["total_orders"] == 1
    assert body["points"][-1]["revenue"] == "30.00"
    assert body["points"][-1]["order_count"] == 1


def test_top_products_ranked_by_revenue(client: TestClient, auth_headers: dict[str, str]) -> None:
    cheap = _product(client, auth_headers, "CHEAP", "1.00", 1000)
    premium = _product(client, auth_headers, "PREM", "100.00", 1000)
    customer = _customer(client, auth_headers, "Buyer", "buyer@example.com")
    _order(
        client,
        auth_headers,
        customer["id"],
        [
            {"product_id": cheap["id"], "quantity": 5},
            {"product_id": premium["id"], "quantity": 4},
        ],
    )

    body = client.get("/reports/top-products?limit=10", headers=auth_headers).json()
    assert [item["sku"] for item in body["items"]] == ["PREM", "CHEAP"]
    assert body["items"][0]["revenue"] == "400.00"
    assert body["items"][0]["quantity_sold"] == 4
    assert body["items"][1]["revenue"] == "5.00"


def test_sales_by_customer_ranked_by_revenue(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    product = _product(client, auth_headers, "W-1", "10.00", 1000)
    whale = _customer(client, auth_headers, "Whale", "whale@example.com")
    minnow = _customer(client, auth_headers, "Minnow", "minnow@example.com")
    _order(client, auth_headers, whale["id"], [{"product_id": product["id"], "quantity": 10}])
    _order(client, auth_headers, minnow["id"], [{"product_id": product["id"], "quantity": 1}])

    body = client.get("/reports/sales-by-customer?limit=10", headers=auth_headers).json()
    assert [item["full_name"] for item in body["items"]] == ["Whale", "Minnow"]
    assert body["items"][0]["revenue"] == "100.00"
    assert body["items"][0]["order_count"] == 1
    assert body["items"][1]["revenue"] == "10.00"
