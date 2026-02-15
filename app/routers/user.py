# app/routers/user.py
from fastapi import APIRouter, Depends, status, HTTPException
from typing import List
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import User
from app.schemas.user import UserCreate, UserUpdate ,UserResponse ,UserPasswordUpdate
from app.services.user_crud import Base_User

router = APIRouter(prefix="/users", tags=["Users"])

user_repo = Base_User(User)


@router.post("/register", status_code=status.HTTP_201_CREATED , response_model=UserResponse)
def create_user(request: UserCreate, db: Session = Depends(get_db)):

    user = user_repo.create(obj_in=request.model_dump(), db=db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already exists or invalid data"
        )

    return user


@router.get("/", status_code=status.HTTP_200_OK , response_model=List[UserResponse])
def get_all_users(db: Session = Depends(get_db)):

    users = user_repo.get_all(db)
    return users


@router.get("/{id}", status_code=status.HTTP_200_OK , response_model=UserResponse)
def get_user(id: int, db: Session = Depends(get_db)):

    user = user_repo.get(db, id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(id: int, db: Session = Depends(get_db)):

    deleted = user_repo.delete(db, id)
    if not deleted:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}


@router.put("/{id}", status_code=status.HTTP_202_ACCEPTED , response_model=UserResponse)
def update_user(id: int, request: UserUpdate, db: Session = Depends(get_db)):

    user = user_repo.update(db, id, request.model_dump())
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found or invalid data"
        )
    return user


@router.get("/email/{email}",status_code=status.HTTP_200_OK, response_model=UserResponse)
def get_user_by_email(email: str, db: Session = Depends(get_db)):

    user = user_repo.get_by_email(db, email)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User with this email not found"
        )

    return user

@router.get("/username/{username}",status_code=status.HTTP_200_OK,response_model=UserResponse)
def get_user_by_username(username: str, db: Session = Depends(get_db)):

    user = user_repo.get_by_username(db, username)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User with this username not found"
        )

    return user


@router.patch("/{id}/password",status_code=status.HTTP_200_OK,response_model=UserResponse)
def update_user_password(id: int,request: UserPasswordUpdate,db: Session = Depends(get_db)):

    updated_user = user_repo.update_password(db=db,obj_id=id,new_password=request.new_password,old_password=request.old_password)

    if updated_user is None:
        raise HTTPException(status_code=404,detail="User not found")

    if updated_user is False:
        raise HTTPException(status_code=400,detail="Old password is incorrect")

    return updated_user
