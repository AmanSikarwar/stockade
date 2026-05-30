from fastapi.testclient import TestClient


def test_health_and_readiness_endpoints(client: TestClient) -> None:
    health_response = client.get("/health")
    ready_response = client.get("/ready")

    assert health_response.status_code == 200
    assert health_response.json() == {
        "status": "ok",
        "service": "Stockade API",
        "environment": "test",
    }
    assert ready_response.status_code == 200
    assert ready_response.json() == {
        "status": "ready",
        "service": "Stockade API",
    }
