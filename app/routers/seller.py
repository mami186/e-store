
# Endpoints for seller operations (requires SELLER role or higher):
# - POST /seller/apply - Apply to become a seller
# - PUT /seller/profile - Update seller profile
# - POST /seller/products - Create product
# - GET /seller/products - List own products
# - GET /seller/products/{product_id} - Get specific product
# - PUT /seller/products/{product_id} - Update own product
# - DELETE /seller/products/{product_id} - Soft delete (set delisted=true)

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.database import get_db



from app.schemas.seller import SellerCreate ,SellerProfileResponse  , SellerUpdate
from app.services.seller_crud import Base_Seller
from app.models.models import Seller


router = APIRouter(prefix="/seller", tags=["Seller"])


seller_repo = Base_Seller(Seller)

@router.post("/apply", status_code=status.HTTP_201_CREATED)
def create_seller(id:int, request: SellerCreate, db: Session = Depends(get_db)):

    seller = seller_repo.create(obj_in=request.model_dump(), db=db, id=id)    
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Seller already exists or invalid data"
        )
    return seller

@router.put("/{id}",status_code=status.HTTP_202_ACCEPTED)
def update_seller(id:int,request:SellerUpdate ,db:Session=Depends(get_db)):
    
    seller = seller_repo.update(db=db,obj_id=id,obj_in=request.model_dump())
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seller not found or invalid data"
        )
    return seller



@router.get("/", status_code=status.HTTP_200_OK)
def get_all_seller(db: Session = Depends(get_db)):

    seller = seller_repo.get_all(db)
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seller not found"
        )
    return seller


@router.get("/{id}", status_code=status.HTTP_200_OK)
def get_seller(id: int, db: Session = Depends(get_db)):

    seller = seller_repo.get(db, id)
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seller not found"
        )
    return seller

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_seller(id: int, db: Session = Depends(get_db)):

    seller = seller_repo.delete(db, id)
    if not seller:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Seller not found"
        )
    return {"message": "Seller deleted successfully"}

