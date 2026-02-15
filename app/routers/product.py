from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db


from app.schemas.product import ProductCreate, ProductResponse, ProductUpdate
from app.services.product_crud import Base_Product
from app.models.models import Product


router = APIRouter(prefix="/product", tags=["Product"])


product_repo = Base_Product(Product)


@router.post("/", status_code=status.HTTP_201_CREATED, response_model=ProductResponse)
def create_product(id: int, request: ProductCreate, db: Session = Depends(get_db)):

    product = product_repo.create(obj_in=request.model_dump(), db=db, seller_id=id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product already exists or invalid data",
        )
    return product


@router.put("/{id}", status_code=status.HTTP_200_OK, response_model=ProductResponse)
def update_product(id: int, request: ProductUpdate, db: Session = Depends(get_db)):

    product = product_repo.update(db=db, product_id=id, obj_in=request.model_dump())
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found or invalid data",
        )
    return product


@router.get("/", status_code=status.HTTP_200_OK, response_model=List[ProductResponse])
def get_all_product(db: Session = Depends(get_db)):

    product = product_repo.get_all(db)
    return product


@router.get("/{id}", status_code=status.HTTP_200_OK, response_model=ProductResponse)
def get_product(id: int, db: Session = Depends(get_db)):

    product = product_repo.get(db, product_id=id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )
    return product


@router.get(
    "/seller/{id}", status_code=status.HTTP_200_OK, response_model=List[ProductResponse]
)
def get_all_product_by_seller(id: int, db: Session = Depends(get_db)):

    product = product_repo.get_all_by_seller(db, seller_id=id)

    return product


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(id: int, db: Session = Depends(get_db)):

    product = product_repo.delete(db, product_id=id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Product not found"
        )
    return {"message": "Product deleted successfully"}
