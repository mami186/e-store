from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import Settings
from app.core.database import Base, engine
from app.api.v1 import (
    admin,
    auth,
    carts,
    comments,
    orders,
    products,
    sellers,
    users,
    wishlists,
)
from app.models.user import Role

settings = Settings()

ROLE_SEEDS: list[dict] = [
    {"id": 0, "name": "user", "description": "Basic user"},
    {"id": 1, "name": "seller", "description": "Can create and manage products"},
    {"id": 2, "name": "moderator", "description": "Can moderate content"},
    {"id": 3, "name": "admin", "description": "Can manage users and promote to moderator"},
    {"id": 4, "name": "super_admin", "description": "Full access to all features"},
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    from app.core.database import async_session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        for role_data in ROLE_SEEDS:
            from sqlalchemy import select

            result = await session.execute(select(Role).where(Role.id == role_data["id"]))
            if not result.scalar_one_or_none():
                session.add(Role(**role_data))
        await session.commit()

    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="E-commerce API with Role-Based Access Control (RBAC)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(sellers.router, prefix="/api/v1")
app.include_router(products.router, prefix="/api/v1")
app.include_router(comments.router, prefix="/api/v1")
app.include_router(carts.router, prefix="/api/v1")
app.include_router(wishlists.router, prefix="/api/v1")
app.include_router(orders.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {
        "name": settings.APP_NAME,
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}
