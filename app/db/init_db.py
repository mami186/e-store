from sqlalchemy.orm import Session
from app.models.models import Role
from app.db.database import engine, Base

DEFAULT_ROLES = [
    {"id": 0, "name": "user", "description": "Default user role"},
    {"id": 1, "name": "seller", "description": "Seller role"},
    {"id": 2, "name": "moderator", "description": "Moderator role"},
    {"id": 3, "name": "admin", "description": "Admin role"},
    {"id": 4, "name": "super_admin", "description": "Super Admin role"},
]


def init_db():
    # Create all tables
    Base.metadata.create_all(bind=engine)

    # Open a DB session
    db = Session(bind=engine)

    # Seed roles
    for role_data in DEFAULT_ROLES:
        existing = db.query(Role).filter_by(id=role_data["id"]).first()
        if not existing:
            role = Role(
                id=role_data["id"],
                name=role_data["name"],
                description=role_data["description"],
            )
            db.add(role)
    db.commit()
    db.close()
    print("Database initialized with default roles.")


if __name__ == "__main__":
    init_db()
