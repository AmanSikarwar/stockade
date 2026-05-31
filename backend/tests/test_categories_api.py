from fastapi.testclient import TestClient


def _create_category(client: TestClient, headers: dict[str, str], name: str) -> dict:
    response = client.post("/categories", headers=headers, json={"name": name})
    assert response.status_code == 201
    return response.json()


def test_categories_require_authentication(client: TestClient) -> None:
    response = client.get("/categories")
    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "unauthorized"


def test_category_crud_flow(client: TestClient, auth_headers: dict[str, str]) -> None:
    created = _create_category(client, auth_headers, "  Packaging  ")
    assert created["name"] == "Packaging"
    assert created["product_count"] == 0
    category_id = created["id"]

    listed = client.get("/categories", headers=auth_headers).json()
    assert listed["total"] == 1
    assert listed["items"][0]["id"] == category_id

    fetched = client.get(f"/categories/{category_id}", headers=auth_headers)
    assert fetched.status_code == 200

    updated = client.put(f"/categories/{category_id}", headers=auth_headers, json={"name": "Boxes"})
    assert updated.status_code == 200
    assert updated.json()["name"] == "Boxes"

    deleted = client.delete(f"/categories/{category_id}", headers=auth_headers)
    assert deleted.status_code == 204
    assert client.get(f"/categories/{category_id}", headers=auth_headers).status_code == 404


def test_duplicate_category_name_conflicts(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    _create_category(client, auth_headers, "Packaging")
    response = client.post("/categories", headers=auth_headers, json={"name": "Packaging"})
    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "duplicate_category"


def test_category_list_includes_product_count(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    category = _create_category(client, auth_headers, "Packaging")
    for sku in ("P-1", "P-2"):
        response = client.post(
            "/products",
            headers=auth_headers,
            json={
                "name": f"Item {sku}",
                "sku": sku,
                "price": "1.00",
                "quantity_in_stock": 10,
                "category_id": category["id"],
            },
        )
        assert response.status_code == 201

    listed = client.get("/categories", headers=auth_headers).json()
    assert listed["items"][0]["product_count"] == 2


def test_deleting_category_uncategorizes_products(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    category = _create_category(client, auth_headers, "Packaging")
    product = client.post(
        "/products",
        headers=auth_headers,
        json={
            "name": "Mailer",
            "sku": "M-1",
            "price": "1.00",
            "quantity_in_stock": 10,
            "category_id": category["id"],
        },
    ).json()
    assert product["category_id"] == category["id"]

    assert client.delete(f"/categories/{category['id']}", headers=auth_headers).status_code == 204

    refreshed = client.get(f"/products/{product['id']}", headers=auth_headers).json()
    assert refreshed["category_id"] is None
