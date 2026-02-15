import pytest


@pytest.fixture(scope="function")
def test_user(client):
    payload = {
        "first_name": "Test",
        "last_name": "User",
        "username": "testuser",
        "email": "testuser@example.com",
        "password": "test123",
    }
    response = client.post("/users/register", json=payload)
    assert response.status_code == 201
    return response.json()


def test_create_user(client):
    payload = {
        "first_name": "Alice",
        "last_name": "Smith",
        "username": "alicesmith",
        "email": "alice@example.com",
        "password": "alice123",
    }
    response = client.post("/users/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["username"] == "alicesmith"
    assert data["email"] == "alice@example.com"
    assert "id" in data


def test_get_all_users(client, test_user):
    response = client.get("/users/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0


def test_get_user_by_id(client, test_user):
    user_id = test_user["id"]
    response = client.get(f"/users/{user_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == user_id
    assert data["username"] == test_user["username"]


def test_update_user(client, test_user):
    user_id = test_user["id"]
    payload = {
        "id": user_id,
        "first_name": "Updated",
        "last_name": "User",
        "password": "newpassword",
    }
    response = client.put(f"/users/{user_id}", json=payload)
    assert response.status_code == 202
    data = response.json()
    assert data["first_name"] == "Updated"
    assert data["last_name"] == "User"


def test_delete_user(client, test_user):
    # Fixed user data for delete test
    user_id = test_user["id"]

    del_response = client.delete(f"/users/{user_id}")
    assert del_response.status_code == 204

    # Verify user no longer exists
    get_response = client.get(f"/users/{user_id}")
    assert get_response.status_code == 404
