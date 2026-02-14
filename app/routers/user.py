# app/routers/user.py
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import User
from app.schemas.user import UserCreate , UserUpdate
from app.services.user_crud import Base_User

router = APIRouter(prefix="/users", tags=["Users"])

user_repo = Base_User(User)

@router.post("/register", status_code=status.HTTP_201_CREATED)
def create_user(request: UserCreate, db: Session = Depends(get_db)):

    user = user_repo.create(obj_in=request.model_dump(), db=db)
    
    return user


@router.get("/", status_code=status.HTTP_200_OK)
def get_all_users(db: Session = Depends(get_db)):

    users = user_repo.get_all(db)
    return users


@router.get("/{id}", status_code=status.HTTP_200_OK)
def get_user(id: int, db: Session = Depends(get_db)):

    user = user_repo.get(db, id)
    return user

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(id: int, db: Session = Depends(get_db)):

    user = user_repo.delete(db, id)
    return user

@router.put("/{id}",status_code=status.HTTP_202_ACCEPTED)
def update_user(request:UserUpdate,db:Session=Depends(get_db)):
    
    user = user_repo.update(db, request.id, request.model_dump())
    return user