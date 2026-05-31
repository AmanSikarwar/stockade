from fastapi.testclient import TestClient

from app.models.user import User


def test_login_issues_token_and_me_resolves_user(
    client: TestClient,
    admin_user: User,
) -> None:
    login_response = client.post(
        "/auth/login",
        json={"email": admin_user.email, "password": "test-admin-password"},
    )

    assert login_response.status_code == 200
    token_payload = login_response.json()
    assert token_payload["token_type"] == "bearer"
    assert token_payload["expires_in"] == 3600
    assert token_payload["access_token"]

    me_response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token_payload['access_token']}"},
    )

    assert me_response.status_code == 200
    assert me_response.json() == {
        "id": str(admin_user.id),
        "organization_id": str(admin_user.organization_id),
        "email": admin_user.email,
        "role": "admin",
    }


def test_refresh_issues_new_token_for_valid_session(
    client: TestClient,
    auth_headers: dict[str, str],
    admin_user: User,
) -> None:
    refresh_response = client.post("/auth/refresh", headers=auth_headers)

    assert refresh_response.status_code == 200
    payload = refresh_response.json()
    assert payload["token_type"] == "bearer"
    assert payload["access_token"]

    me_response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {payload['access_token']}"},
    )
    assert me_response.status_code == 200
    assert me_response.json()["email"] == admin_user.email


def test_refresh_rejects_missing_token(client: TestClient) -> None:
    assert client.post("/auth/refresh").status_code == 401


def test_login_rejects_invalid_credentials(
    client: TestClient,
    admin_user: User,
) -> None:
    response = client.post(
        "/auth/login",
        json={"email": admin_user.email, "password": "wrong-password"},
    )

    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "invalid_credentials"


def test_me_rejects_invalid_token(client: TestClient) -> None:
    response = client.get("/auth/me", headers={"Authorization": "Bearer bad-token"})

    assert response.status_code == 401
    assert response.json()["detail"]["code"] == "unauthorized"
