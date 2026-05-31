from fastapi.testclient import TestClient


def _category(client: TestClient, headers: dict[str, str], name: str) -> str:
    return client.post("/categories", headers=headers, json={"name": name}).json()["id"]


def test_create_product_with_category_and_reorder_point(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    category_id = _category(client, auth_headers, "Packaging")

    response = client.post(
        "/products",
        headers=auth_headers,
        json={
            "name": "Mailer",
            "sku": "M-1",
            "price": "1.20",
            "quantity_in_stock": 100,
            "category_id": category_id,
            "reorder_point": 25,
        },
    )

    assert response.status_code == 201
    body = response.json()
    assert body["category_id"] == category_id
    assert body["reorder_point"] == 25


def test_create_product_with_unknown_category_is_rejected(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    response = client.post(
        "/products",
        headers=auth_headers,
        json={
            "name": "Mailer",
            "sku": "M-1",
            "price": "1.20",
            "quantity_in_stock": 100,
            "category_id": "00000000-0000-0000-0000-000000000000",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "invalid_product"


def test_filter_products_by_category(client: TestClient, auth_headers: dict[str, str]) -> None:
    packaging = _category(client, auth_headers, "Packaging")
    labels = _category(client, auth_headers, "Labels")

    client.post(
        "/products",
        headers=auth_headers,
        json={
            "name": "Mailer",
            "sku": "M-1",
            "price": "1.20",
            "quantity_in_stock": 100,
            "category_id": packaging,
        },
    )
    client.post(
        "/products",
        headers=auth_headers,
        json={
            "name": "Label",
            "sku": "L-1",
            "price": "0.10",
            "quantity_in_stock": 100,
            "category_id": labels,
        },
    )

    response = client.get(f"/products?category_id={packaging}", headers=auth_headers)
    assert response.status_code == 200
    items = response.json()["items"]
    assert len(items) == 1
    assert items[0]["sku"] == "M-1"


def test_dashboard_low_stock_uses_per_product_reorder_point(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    # On hand 20: low against its own reorder point of 25, even though it exceeds
    # the global threshold of 5.
    client.post(
        "/products",
        headers=auth_headers,
        json={
            "name": "Tracked",
            "sku": "TRK-1",
            "price": "5.00",
            "quantity_in_stock": 20,
            "reorder_point": 25,
        },
    )
    # On hand 20, no reorder point -> uses global threshold of 5 -> not low.
    client.post(
        "/products",
        headers=auth_headers,
        json={
            "name": "Untracked",
            "sku": "UNT-1",
            "price": "5.00",
            "quantity_in_stock": 20,
        },
    )

    payload = client.get("/dashboard", headers=auth_headers).json()
    low_skus = {product["sku"] for product in payload["low_stock_products"]}
    assert "TRK-1" in low_skus
    assert "UNT-1" not in low_skus


def test_update_product_reorder_point_and_category(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    category_id = _category(client, auth_headers, "Packaging")
    product = client.post(
        "/products",
        headers=auth_headers,
        json={"name": "Mailer", "sku": "M-1", "price": "1.20", "quantity_in_stock": 100},
    ).json()
    assert product["category_id"] is None

    response = client.put(
        f"/products/{product['id']}",
        headers=auth_headers,
        json={"category_id": category_id, "reorder_point": 10},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["category_id"] == category_id
    assert body["reorder_point"] == 10
