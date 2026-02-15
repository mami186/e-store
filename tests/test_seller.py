# import pytest


# @pytest.fixture(scope="module")
# def test_seller(client):
#     payload = {
#         "shop_name": "Test Shop",
#         "shop_description": "Test Description",
#         "payout_account": "test_account_123",
#     }

#     response = client.post("/seller/apply", json=payload)
#     assert response.status_code == 201
#     return response.json()


# def test_create_seller(client):
#     payload = {
#         "shop_name": "Alice Shop",
#         "shop_description": "Alice Description",
#         "payout_account": "alice_account_123",
#     }

#     response = client.post("/seller/apply", json=payload)

#     assert response.status_code == 201
#     data = response.json()

#     assert data["shop_name"] == "Alice Shop"
#     assert data["shop_description"] == "Alice Description"
#     assert data["payout_account"] == "alice_account_123"
#     assert "user_id" in data or "id" in data


# def test_get_all_sellers(client, test_seller):
#     response = client.get("/seller/")

#     assert response.status_code == 200
#     data = response.json()

#     assert isinstance(data, list)
#     assert len(data) > 0


# def test_get_seller_by_id(client, test_seller):
#     # Your Seller model uses user_id as primary key
#     seller_id = test_seller.get("user_id") or test_seller.get("id")

#     response = client.get(f"/seller/{seller_id}")

#     assert response.status_code == 200
#     data = response.json()

#     assert data is not None
#     assert data["shop_name"] == test_seller["shop_name"]


# def test_update_seller(client, test_seller):
#     seller_id = test_seller.get("user_id") or test_seller.get("id")

#     payload = {
#         "id": seller_id,
#         "shop_name": "Updated Shop",
#         "shop_description": "Updated Description",
#         "payout_account": "updated_account_123",
#     }

#     response = client.put(f"/seller/{seller_id}", json=payload)

#     assert response.status_code == 202
#     data = response.json()

#     assert data["shop_name"] == "Updated Shop"
#     assert data["shop_description"] == "Updated Description"
#     assert data["payout_account"] == "updated_account_123"


# def test_delete_seller(client):
#     payload = {
#         "shop_name": "Delete Shop",
#         "shop_description": "Delete Description",
#         "payout_account": "delete_account_123",
#     }

#     # Create seller
#     response = client.post("/seller/apply", json=payload)
#     assert response.status_code == 201

#     seller_id = response.json().get("user_id") or response.json().get("id")

#     # Delete seller
#     del_response = client.delete(f"/seller/{seller_id}")
#     assert del_response.status_code == 204

#     # Verify deletion
#     get_response = client.get(f"/seller/{seller_id}")
#     assert get_response.status_code == 200
#     assert get_response.json() is None or get_response.json() == {}
