from fastapi.testclient import TestClient


def _create_product(client: TestClient, headers: dict[str, str], **fields: object) -> dict:
    response = client.post("/products", headers=headers, json=fields)
    assert response.status_code == 201
    return response.json()


def test_products_sort_by_name_ascending(client: TestClient, auth_headers: dict[str, str]) -> None:
    _create_product(
        client, auth_headers, name="Banana", sku="B-1", price="1.00", quantity_in_stock=1
    )
    _create_product(
        client, auth_headers, name="Apple", sku="A-1", price="9.00", quantity_in_stock=1
    )
    _create_product(
        client, auth_headers, name="Cherry", sku="C-1", price="5.00", quantity_in_stock=1
    )

    response = client.get("/products?sort_by=name&sort_dir=asc", headers=auth_headers)

    assert response.status_code == 200
    names = [item["name"] for item in response.json()["items"]]
    assert names == ["Apple", "Banana", "Cherry"]


def test_products_sort_by_price_descending(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    _create_product(
        client, auth_headers, name="Banana", sku="B-1", price="1.00", quantity_in_stock=1
    )
    _create_product(
        client, auth_headers, name="Apple", sku="A-1", price="9.00", quantity_in_stock=1
    )
    _create_product(
        client, auth_headers, name="Cherry", sku="C-1", price="5.00", quantity_in_stock=1
    )

    response = client.get("/products?sort_by=price&sort_dir=desc", headers=auth_headers)

    assert response.status_code == 200
    prices = [item["price"] for item in response.json()["items"]]
    assert prices == ["9.00", "5.00", "1.00"]


def test_products_invalid_sort_field_is_rejected(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    response = client.get("/products?sort_by=secret_column", headers=auth_headers)

    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "invalid_request"


def test_customers_sort_by_full_name_ascending(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    for name, email in [("Zoe", "z@e.com"), ("Amir", "a@e.com"), ("Mara", "m@e.com")]:
        response = client.post(
            "/customers",
            headers=auth_headers,
            json={"full_name": name, "email": email, "phone_number": None},
        )
        assert response.status_code == 201

    response = client.get("/customers?sort_by=full_name&sort_dir=asc", headers=auth_headers)

    assert response.status_code == 200
    names = [item["full_name"] for item in response.json()["items"]]
    assert names == ["Amir", "Mara", "Zoe"]


def test_orders_sort_by_total_amount_ascending(
    client: TestClient, auth_headers: dict[str, str]
) -> None:
    product = _create_product(
        client, auth_headers, name="Widget", sku="W-1", price="10.00", quantity_in_stock=100
    )
    customer = client.post(
        "/customers",
        headers=auth_headers,
        json={"full_name": "Buyer", "email": "buyer@e.com", "phone_number": None},
    ).json()

    for quantity in (3, 1, 2):
        response = client.post(
            "/orders",
            headers=auth_headers,
            json={
                "customer_id": customer["id"],
                "line_items": [{"product_id": product["id"], "quantity": quantity}],
            },
        )
        assert response.status_code == 201

    response = client.get("/orders?sort_by=total_amount&sort_dir=asc", headers=auth_headers)

    assert response.status_code == 200
    totals = [item["total_amount"] for item in response.json()["items"]]
    assert totals == ["10.00", "20.00", "30.00"]
