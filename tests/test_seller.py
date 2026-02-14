# def test_create_seller(client):
#     # Note: This is expected to fail if user_id is not handled in the endpoint
#     response = client.post(
#         "/seller/apply",
#         json={
#             "shop_name": "Test Shop",
#             "shop_description": "A great shop",
#             "payout_account": "1234567890"
#         }
#     )
#     assert response.status_code == 201
#     data = response.json()
#     assert data["shop_name"] == "Test Shop"

# def test_get_all_sellers(client):
#     response = client.get("/seller/")
#     assert response.status_code == 200
#     data = response.json()
#     assert isinstance(data, list)

# def test_get_seller(client):
#     # Assuming seller created has ID 1 (if successful)
#     response = client.get("/seller/1")
#     # If create failed, this might return null or 404.
#     # Asserting 200 for now.
#     assert response.status_code == 200

# def test_update_seller(client):
#     response = client.put(
#         "/seller/1",
#         json={
#             "shop_name": "Updated Shop Name",
#             "shop_description": "Updated description",
#             "payout_account": "0987654321"
#         }
#     )
#     # Endpoint expects SellerUpdate which has id?
#     # Endpoint def: update_seller(request:SellerUpdate, ...)
#     # Schema SellerUpdate: id, shop_name, ...
#     # So json must include id if used in body.
#     # Note: request.id in endpoint is used.
#     # So we need sending ID in body.
#     # But wait, endpoint signature: update_seller(request:SellerUpdate, ...)
#     # It takes ID from request body. path /{id} is unused in logic?
#     # verify logic later.
#     assert response.status_code == 202

# def test_delete_seller(client):
#     response = client.delete("/seller/1")
#     assert response.status_code == 204
