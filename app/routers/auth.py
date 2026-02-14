# """
# Authentication Router

# Endpoints:
# - POST /auth/register - Register new user (default role: User)
# - POST /auth/login - Login and receive JWT token
# """

# from datetime import timedelta
# from fastapi import APIRouter, Depends, HTTPException, status
# from fastapi.security import OAuth2PasswordRequestForm
# from sqlalchemy.orm import Session

# from app.db.database import get_db
# from app.schemas.pydantic_schemas import UserCreate, UserResponse, Token
# from app.services.user_crud import Base_User
# from app.models.models import User
# from app.utils.auth import authenticate_user, create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

# router = APIRouter(prefix="/auth", tags=["Authentication"])

# user_repo = Base_User(User)


# @router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
# def register_user(user: UserCreate, db: Session = Depends(get_db)):
#     """
#     Register a new user with default USER role (role_id=0)
    
#     - **email**: Valid email address (must be unique)
#     - **username**: Username (min 3 chars, must be unique)
#     - **password**: Password (min 8 chars, must contain letter and digit)
    
#     Returns created user profile with assigned USER role
#     """
#     return user_repo.create(db=db, obj_in=user.model_dump())


# @router.post("/login", response_model=Token)
# def login_user(
#     form_data: OAuth2PasswordRequestForm = Depends(),
#     db: Session = Depends(get_db)
# ):
#     """
#     Login with username/email and password to receive JWT access token
    
#     - **username**: Username or email address
#     - **password**: User password
    
#     Returns JWT access token for authenticated requests
#     """
#     # Authenticate user
#     user = authenticate_user(db, form_data.username, form_data.password)
#     if not user:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Incorrect username or password",
#             headers={"WWW-Authenticate": "Bearer"},
#         )
    
#     # Check if user is active
#     if not user.is_active:
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="User account is inactive",
#         )
    
#     # Create access token
#     access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
#     access_token = create_access_token(
#         data={"sub": user.username},
#         expires_delta=access_token_expires
#     )
    
#     return {"access_token": access_token, "token_type": "bearer"}
