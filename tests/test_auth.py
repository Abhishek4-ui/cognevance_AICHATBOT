import pytest
from backend.app import app
from backend.middleware.auth import generate_token, decode_token, hash_password, check_password


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_password_hashing():
    pw = "mySecretPassword123"
    hashed = hash_password(pw)
    assert hashed != pw
    assert check_password(pw, hashed) is True
    assert check_password("wrongPassword", hashed) is False


def test_jwt_generation_and_decode():
    token = generate_token("user123", "test@neurochat.ai", role="admin", username="Tester")
    decoded = decode_token(token)
    assert decoded["sub"] == "user123"
    assert decoded["email"] == "test@neurochat.ai"
    assert decoded["role"] == "admin"


def test_health_endpoint(client):
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.get_json()
    assert data["status"] == "healthy"
    assert data["database_connected"] is True


def test_admin_login(client):
    res = client.post("/api/auth/login", json={
        "email": "admin@neurochat.ai",
        "password": "admin123"
    })
    assert res.status_code == 200
    data = res.get_json()
    assert "token" in data
    assert data["user"]["role"] == "admin"
