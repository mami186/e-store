

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import auth, user, seller, product, admin
from app.db.database import engine
from app.models.models import Base

# Create FastAPI app
app = FastAPI(
    title="Estore API",
    description="E-commerce API with Role-Based Access Control (RBAC)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
# app.include_router(auth.router)
app.include_router(user.router)
app.include_router(seller.router)
# app.include_router(product.router)
# app.include_router(admin.router)


from app.db.init_db import init_db

# ...

@app.on_event("startup")
async def startup_event():
    """
    Startup event handler
    
    Initialize database and seed roles
    """
    init_db()


@app.get("/")
def root():
    """
    Root endpoint with API information
    """
    return {
        "message": "Welcome to Estore API",
        "version": "1.0.0",
        "docs": "/docs",
        "roles": {
            "0": "User - Basic user",
            "1": "Seller - Can create and manage products",
            "2": "Moderator - Can moderate content",
            "3": "Admin - Can promote to moderator and manage users",
            "4": "Super Admin - Can promote to admin, full access"
        },
        "endpoints": {
            "authentication": "/auth",
            "users": "/users",
            "sellers": "/seller",
            "products": "/products",
            "admin": "/admin"
        }
    }


@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
