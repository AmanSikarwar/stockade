#!/usr/bin/env sh
set -eu

: "${STOCKADE_BACKEND_URL:?Set STOCKADE_BACKEND_URL, for example https://api.example.com}"
: "${STOCKADE_FRONTEND_URL:?Set STOCKADE_FRONTEND_URL, for example https://app.example.com}"
: "${STOCKADE_ADMIN_EMAIL:?Set STOCKADE_ADMIN_EMAIL}"
: "${STOCKADE_ADMIN_PASSWORD:?Set STOCKADE_ADMIN_PASSWORD}"

"${PYTHON:-python3}" - <<'PY'
from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.request


BACKEND_URL = os.environ["STOCKADE_BACKEND_URL"].rstrip("/")
FRONTEND_URL = os.environ["STOCKADE_FRONTEND_URL"].rstrip("/")
ADMIN_EMAIL = os.environ["STOCKADE_ADMIN_EMAIL"]
ADMIN_PASSWORD = os.environ["STOCKADE_ADMIN_PASSWORD"]
STAMP = str(int(time.time()))


def fail(message: str) -> None:
    raise SystemExit(f"[fail] {message}")


def ok(message: str) -> None:
    print(f"[ok] {message}")


def request(
    method: str,
    path_or_url: str,
    *,
    token: str | None = None,
    payload: dict[str, object] | None = None,
    expected: set[int] | None = None,
    headers: dict[str, str] | None = None,
) -> tuple[int, dict[str, str], object | None, str]:
    expected = expected or {200}
    url = path_or_url if path_or_url.startswith("http") else f"{BACKEND_URL}{path_or_url}"
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=body, method=method)
    req.add_header("Accept", "application/json")
    if payload is not None:
        req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    for key, value in (headers or {}).items():
        req.add_header(key, value)

    try:
        with urllib.request.urlopen(req, timeout=30) as response:
            text = response.read().decode("utf-8")
            status = response.status
            response_headers = {key.lower(): value for key, value in response.headers.items()}
    except urllib.error.HTTPError as exc:
        text = exc.read().decode("utf-8")
        status = exc.code
        response_headers = {key.lower(): value for key, value in exc.headers.items()}

    if status not in expected:
        fail(f"{method} {url} returned {status}, expected {sorted(expected)}: {text[:500]}")

    parsed: object | None = None
    content_type = response_headers.get("content-type", "")
    if text and "json" in content_type:
        parsed = json.loads(text)
    return status, response_headers, parsed, text


def expect_dict(value: object, context: str) -> dict[str, object]:
    if not isinstance(value, dict):
        fail(f"{context} returned non-object JSON: {value!r}")
    return value


def expect_id(value: object, context: str) -> str:
    data = expect_dict(value, context)
    identifier = data.get("id")
    if not isinstance(identifier, str) or not identifier:
        fail(f"{context} did not return an id: {data!r}")
    return identifier


request("GET", f"{FRONTEND_URL}/", expected={200})
request("GET", f"{FRONTEND_URL}/app/orders", expected={200})
ok("frontend root and deep link return HTTP 200")

_, _, ready_body, _ = request("GET", "/ready")
ready = expect_dict(ready_body, "readiness")
if ready.get("status") != "ready":
    fail(f"readiness did not report ready: {ready!r}")
ok("backend readiness endpoint reports ready")

_, _, openapi_body, _ = request("GET", "/openapi.json")
openapi = expect_dict(openapi_body, "OpenAPI")
paths = expect_dict(openapi.get("paths"), "OpenAPI paths")
required_paths = {
    "/auth/login",
    "/products",
    "/customers",
    "/orders",
    "/dashboard",
}
missing_paths = sorted(required_paths - set(paths.keys()))
if missing_paths:
    fail(f"OpenAPI is missing paths: {missing_paths}")
ok("OpenAPI contains core API paths")

_, cors_headers, _, _ = request(
    "OPTIONS",
    "/products",
    expected={200, 204},
    headers={
        "Origin": FRONTEND_URL,
        "Access-Control-Request-Method": "GET",
        "Access-Control-Request-Headers": "Authorization",
    },
)
allowed_origin = cors_headers.get("access-control-allow-origin")
if allowed_origin != FRONTEND_URL:
    fail(
        "CORS preflight did not allow the frontend origin: "
        f"expected {FRONTEND_URL!r}, got {allowed_origin!r}"
    )
ok("CORS preflight allows the configured frontend origin")

_, _, login_body, _ = request(
    "POST",
    "/auth/login",
    payload={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
)
login = expect_dict(login_body, "login")
token = login.get("access_token")
if not isinstance(token, str) or not token:
    fail(f"login did not return an access token: {login!r}")
ok("admin login returned a token")

product_name = f"Verification product {STAMP}"
product_sku = f"VERIFY-{STAMP}"
product_price = "4.25"
initial_stock = 5
_, _, product_body, _ = request(
    "POST",
    "/products",
    token=token,
    expected={201},
    payload={
        "name": product_name,
        "sku": product_sku,
        "price": product_price,
        "quantity_in_stock": initial_stock,
    },
)
product_id = expect_id(product_body, "create product")
ok("product creation works")

customer_email = f"verify-{STAMP}@example.com"
_, _, customer_body, _ = request(
    "POST",
    "/customers",
    token=token,
    expected={201},
    payload={
        "full_name": f"Verification Customer {STAMP}",
        "email": customer_email,
        "phone_number": "+1-555-0100",
    },
)
customer_id = expect_id(customer_body, "create customer")
ok("customer creation works")

_, _, overstock_body, _ = request(
    "POST",
    "/orders",
    token=token,
    expected={409},
    payload={
        "customer_id": customer_id,
        "line_items": [{"product_id": product_id, "quantity": initial_stock + 1}],
    },
)
overstock = expect_dict(overstock_body, "overstock order")
detail = expect_dict(overstock.get("detail"), "overstock detail")
if detail.get("code") != "insufficient_stock":
    fail(f"overstock order did not return insufficient_stock: {overstock!r}")
ok("overstock order returns a specific insufficient-stock error")

order_quantity = 2
_, _, order_body, _ = request(
    "POST",
    "/orders",
    token=token,
    expected={201},
    payload={
        "customer_id": customer_id,
        "line_items": [{"product_id": product_id, "quantity": order_quantity}],
    },
)
order = expect_dict(order_body, "create order")
order_id = expect_id(order, "create order")
if order.get("total_amount") != "8.50":
    fail(f"server-computed total was not 8.50: {order!r}")
line_items = order.get("line_items")
if not isinstance(line_items, list) or len(line_items) != 1:
    fail(f"order did not return one line item: {order!r}")
line = expect_dict(line_items[0], "order line")
if line.get("unit_price") != product_price or line.get("line_total") != "8.50":
    fail(f"order line did not keep expected price snapshots: {line!r}")
ok("order creation computes totals and snapshots unit price")

_, _, product_after_order_body, _ = request("GET", f"/products/{product_id}", token=token)
product_after_order = expect_dict(product_after_order_body, "product after order")
if product_after_order.get("quantity_in_stock") != initial_stock - order_quantity:
    fail(f"stock did not decrement after order: {product_after_order!r}")
ok("order creation decrements stock")

request("DELETE", f"/orders/{order_id}", token=token, expected={204})
_, _, product_after_cancel_body, _ = request("GET", f"/products/{product_id}", token=token)
product_after_cancel = expect_dict(product_after_cancel_body, "product after cancellation")
if product_after_cancel.get("quantity_in_stock") != initial_stock:
    fail(f"stock did not restore after cancellation: {product_after_cancel!r}")
ok("order cancellation restores stock")

_, _, order_detail_body, _ = request("GET", f"/orders/{order_id}", token=token)
order_detail = expect_dict(order_detail_body, "order detail")
if order_detail.get("status") != "cancelled":
    fail(f"cancelled order detail did not show cancelled status: {order_detail!r}")
ok("order detail is reachable and reflects cancellation")

_, _, dashboard_body, _ = request("GET", "/dashboard", token=token)
dashboard = expect_dict(dashboard_body, "dashboard")
for key in (
    "total_products",
    "total_customers",
    "total_orders",
    "low_stock_products",
):
    if key not in dashboard:
        fail(f"dashboard missing {key}: {dashboard!r}")
ok("dashboard returns live metrics")

print("[ok] live deployment verification completed")
PY
