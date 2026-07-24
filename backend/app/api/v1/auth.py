from __future__ import annotations

from datetime import timezone
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Request, Response
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import Settings
from app.core.database import get_db
from app.core.exceptions import ConflictException, NotFoundException, UnauthorizedException
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    hash_token,
    verify_password,
)
from app.models.restriction import Appeal, Restriction
from app.models.user import TokenBlacklist, User, UserRole, RefreshToken, Role
from app.schemas.restriction import AppealCreate, AppealResponse
from app.schemas.auth import (
    GoogleAuthRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
)
from app.schemas.user import UserResponse
from app.api.deps import get_current_active_user, oauth2_scheme

settings = Settings()
router = APIRouter(prefix="/auth", tags=["auth"])

REFRESH_COOKIE_KEY = "refresh_token"
REFRESH_COOKIE_MAX_AGE = settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600


def set_refresh_cookie(response: Response, token: str) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE_KEY,
        value=token,
        httponly=True,
        samesite="lax",
        max_age=REFRESH_COOKIE_MAX_AGE,
        path="/api/v1/auth",
    )


def clear_refresh_cookie(response: Response) -> None:
    response.delete_cookie(
        key=REFRESH_COOKIE_KEY,
        path="/api/v1/auth",
    )

DEFAULT_ROLES: list[dict] = [
    {"id": 0, "name": "user", "description": "Basic user"},
    {"id": 1, "name": "seller", "description": "Can create and manage products"},
    {"id": 2, "name": "moderator", "description": "Can moderate content"},
    {"id": 3, "name": "admin", "description": "Can manage users and promote to moderator"},
    {"id": 4, "name": "super_admin", "description": "Full access to all features"},
]


async def seed_roles(db: AsyncSession):
    for role_data in DEFAULT_ROLES:
        result = await db.execute(select(Role).where(Role.id == role_data["id"]))
        if not result.scalar_one_or_none():
            db.add(Role(**role_data))





@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(
    data: RegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == data.email))
    if result.scalar_one_or_none():
        raise ConflictException("Email already registered")

    user = User(
        email=data.email,
        password_hash=get_password_hash(data.password),
        first_name=data.first_name,
        last_name=data.last_name,
    )
    db.add(user)
    await db.flush()

    user_role = UserRole(user_id=user.id, role_id=0)
    db.add(user_role)

    await db.refresh(user)
    access_token = create_access_token({"sub": str(user.id), "ver": user.token_version})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    token_hash = hash_token(refresh_token)
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    db_token = RefreshToken(
        user_id=user.id, token_hash=token_hash, expires_at=expires_at
    )
    db.add(db_token)
    await db.commit()
    await db.refresh(user)

    set_refresh_cookie(response, refresh_token)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/login", response_model=TokenResponse)
async def login(
    data: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not user.password_hash or not verify_password(data.password, user.password_hash):
        raise UnauthorizedException("Invalid email or password")

    access_token = create_access_token({"sub": str(user.id), "ver": user.token_version})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    token_hash = hash_token(refresh_token)
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    db_token = RefreshToken(
        user_id=user.id, token_hash=token_hash, expires_at=expires_at
    )
    db.add(db_token)
    await db.commit()

    set_refresh_cookie(response, refresh_token)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(
    request: Request,
    response: Response,
    data: RefreshRequest | None = None,
    db: AsyncSession = Depends(get_db),
):
    refresh_token = request.cookies.get(REFRESH_COOKIE_KEY)
    if not refresh_token and data:
        refresh_token = data.refresh_token
    if not refresh_token:
        raise UnauthorizedException("Refresh token missing")

    token_hash = hash_token(refresh_token)
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked == False,
            RefreshToken.expires_at > datetime.now(timezone.utc),
        )
    )
    db_token = result.scalar_one_or_none()
    if not db_token:
        raise UnauthorizedException("Invalid or expired refresh token")

    db_token.revoked = True

    payload = decode_token(refresh_token)
    if not payload:
        raise UnauthorizedException("Invalid refresh token")

    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException("Invalid token payload")

    user_result = await db.execute(select(User).where(User.id == int(user_id)))
    user = user_result.scalar_one_or_none()
    if not user or not user.is_active:
        raise UnauthorizedException("User not found or inactive")

    new_access = create_access_token({"sub": str(user.id), "ver": user.token_version})
    new_refresh = create_refresh_token({"sub": str(user.id)})
    new_hash = hash_token(new_refresh)
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    db.add(
        RefreshToken(
            user_id=user.id, token_hash=new_hash, expires_at=expires_at
        )
    )
    await db.commit()

    set_refresh_cookie(response, new_refresh)
    return TokenResponse(access_token=new_access, refresh_token=new_refresh)


@router.post("/google", response_model=TokenResponse)
async def google_auth(
    data: GoogleAuthRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    try:
        id_info = id_token.verify_oauth2_token(
            data.code,
            google_requests.Request(),
            settings.GOOGLE_CLIENT_ID,
        )
    except ValueError:
        raise UnauthorizedException("Invalid Google token")

    google_id = id_info.get("sub")
    email = id_info.get("email")
    if not google_id or not email:
        raise UnauthorizedException("Invalid Google token payload")

    result = await db.execute(
        select(User).where((User.google_id == google_id) | (User.email == email))
    )
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            email=email,
            google_id=google_id,
            first_name=id_info.get("given_name"),
            last_name=id_info.get("family_name"),
            avatar_url=id_info.get("picture"),
            email_verified=True,
        )
        db.add(user)
        await db.flush()
        db.add(UserRole(user_id=user.id, role_id=0))

    await db.refresh(user)
    access_token = create_access_token({"sub": str(user.id), "ver": user.token_version})
    refresh_token = create_refresh_token({"sub": str(user.id)})
    token_hash = hash_token(refresh_token)
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    db.add(RefreshToken(user_id=user.id, token_hash=token_hash, expires_at=expires_at))
    await db.commit()

    set_refresh_cookie(response, refresh_token)
    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/logout")
async def logout(
    response: Response,
    request: Request,
    data: RefreshRequest | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
    access_token: str | None = Depends(oauth2_scheme),
):
    payload = decode_token(access_token) if access_token else None
    jti = payload.get("jti") if payload else None
    exp = payload.get("exp") if payload else None
    if jti and exp:
        existing = await db.execute(
            select(TokenBlacklist).where(TokenBlacklist.jti == jti)
        )
        if not existing.scalar_one_or_none():
            db.add(TokenBlacklist(jti=jti, expires_at=datetime.fromtimestamp(exp, tz=timezone.utc)))

    refresh_token = request.cookies.get(REFRESH_COOKIE_KEY)
    if not refresh_token and data:
        refresh_token = data.refresh_token
    if refresh_token:
        token_hash = hash_token(refresh_token)
        result = await db.execute(
            select(RefreshToken).where(
                RefreshToken.token_hash == token_hash,
                RefreshToken.user_id == current_user.id,
                RefreshToken.revoked == False,
            )
        )
        db_token = result.scalar_one_or_none()
        if db_token:
            db_token.revoked = True

    clear_refresh_cookie(response)
    await db.commit()
    return {"message": "Logged out"}


@router.post("/logout-all")
async def logout_all(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    current_user.token_version += 1

    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.user_id == current_user.id,
            RefreshToken.revoked == False,
        )
    )
    for token in result.scalars().all():
        token.revoked = True

    await db.commit()
    return {"message": "Logged out of all devices"}


@router.post("/appeals", response_model=AppealResponse, status_code=201)
async def submit_appeal(
    data: AppealCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(Restriction).where(
            Restriction.user_id == current_user.id,
            Restriction.status == "active",
            Restriction.id == data.restriction_id,
        )
    )
    restriction = result.scalar_one_or_none()
    if not restriction:
        raise NotFoundException("Active restriction not found")

    existing = await db.execute(
        select(Appeal).where(
            Appeal.restriction_id == data.restriction_id,
            Appeal.status == "pending",
        )
    )
    if existing.scalar_one_or_none():
        raise ConflictException("Pending appeal already exists for this restriction")

    appeal = Appeal(
        user_id=current_user.id,
        restriction_id=data.restriction_id,
        appeal_text=data.reason_text,
    )
    db.add(appeal)
    await db.commit()
    await db.refresh(appeal)
    return appeal


@router.get("/appeals", response_model=list[AppealResponse])
async def list_my_appeals(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    result = await db.execute(
        select(Appeal)
        .where(Appeal.user_id == current_user.id)
        .order_by(Appeal.created_at.desc())
    )
    return result.scalars().all()


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_active_user)):
    return current_user


@router.get("/session", response_model=TokenResponse)
async def get_session(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    refresh_token = request.cookies.get(REFRESH_COOKIE_KEY)
    if not refresh_token:
        raise UnauthorizedException("No session")

    token_hash = hash_token(refresh_token)
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked == False,
            RefreshToken.expires_at > datetime.now(timezone.utc),
        )
    )
    db_token = result.scalar_one_or_none()
    if not db_token:
        raise UnauthorizedException("Invalid or expired session")

    payload = decode_token(refresh_token)
    if not payload:
        raise UnauthorizedException("Invalid session")

    user_id = payload.get("sub")
    if not user_id:
        raise UnauthorizedException("Invalid token payload")

    user_result = await db.execute(select(User).where(User.id == int(user_id)))
    user = user_result.scalar_one_or_none()
    if not user or not user.is_active:
        raise UnauthorizedException("User not found or inactive")

    db_token.revoked = True

    new_access = create_access_token({"sub": str(user.id), "ver": user.token_version})
    new_refresh = create_refresh_token({"sub": str(user.id)})
    new_hash = hash_token(new_refresh)
    expires_at = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    db.add(
        RefreshToken(
            user_id=user.id, token_hash=new_hash, expires_at=expires_at
        )
    )
    await db.commit()

    set_refresh_cookie(response, new_refresh)
    return TokenResponse(access_token=new_access, refresh_token=new_refresh)
