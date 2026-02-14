
# Endpoints for seller operations (requires SELLER role or higher):
# - POST /seller/apply - Apply to become a seller
# - PUT /seller/profile - Update seller profile
# - POST /seller/products - Create product
# - GET /seller/products - List own products
# - GET /seller/products/{product_id} - Get specific product
# - PUT /seller/products/{product_id} - Update own product
# - DELETE /seller/products/{product_id} - Soft delete (set delisted=true)

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db



from app.schemas.seller import SellerCreate ,SellerProfileResponse , SellerResponse , SellerUpdate
from app.services.seller_crud import Base_Seller
from app.models.models import Seller


router = APIRouter(prefix="/seller", tags=["Seller"])


seller_repo = Base_Seller(Seller)

@router.post("/apply", status_code=status.HTTP_201_CREATED)
def create_seller(request: SellerCreate, db: Session = Depends(get_db)):

    seller = seller_repo.create(obj_in=request.model_dump(), db=db)    
    return seller

@router.put("/{id}",status_code=status.HTTP_202_ACCEPTED)
def update_seller(request:SellerUpdate ,db:Session=Depends(get_db)):
    
    seller = seller_repo.update(db, request.id, request.model_dump())
    return seller



@router.get("/", status_code=status.HTTP_200_OK)
def get_all_seller(db: Session = Depends(get_db)):

    seller = seller_repo.get_all(db)
    return Seller


@router.get("/{id}", status_code=status.HTTP_200_OK)
def get_seller(id: int, db: Session = Depends(get_db)):

    Seller = seller_repo.get(db, id)
    return Seller

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_seller(id: int, db: Session = Depends(get_db)):

    Seller = seller_repo.delete(db, id)
    return Seller