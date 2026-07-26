from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from app.core.config import Settings
from app.core.database import Base, engine
from app.api.v1 import (
    admin,
    auth,
    carts,
    categories,
    comments,
    featured,
    images,
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

    if settings.DEBUG:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

    async with async_session() as session:
        for role_data in ROLE_SEEDS:
            from sqlalchemy import select

            result = await session.execute(select(Role).where(Role.id == role_data["id"]))
            if not result.scalar_one_or_none():
                session.add(Role(**role_data))
        await session.commit()

    from app.services.featured_scheduler import featured_scheduler_loop, refresh_featured_items

    await refresh_featured_items()

    task = asyncio.create_task(featured_scheduler_loop())

    yield

    task.cancel()
    from app.storage.s3 import storage

    await storage.close()


app = FastAPI(
    title=settings.APP_NAME,
    description="E-commerce API with Role-Based Access Control (RBAC)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# TODO: Add CORS middleware with proper origins in production
# app.add_middleware(CORSMiddleware, ...)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(sellers.router, prefix="/api/v1")
app.include_router(categories.router, prefix="/api/v1")
app.include_router(products.router, prefix="/api/v1")
app.include_router(comments.router, prefix="/api/v1")
app.include_router(carts.router, prefix="/api/v1")
app.include_router(featured.router, prefix="/api/v1")
app.include_router(images.router, prefix="/api/v1")
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
