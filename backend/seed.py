"""Seed script: creates an initial super_admin user."""

import asyncio
import sys

sys.path.insert(0, ".")


async def main():
    from app.core.database import async_session
    from app.core.security import get_password_hash
    from app.models.user import User, Role, UserRole

    async with async_session() as db:
        for role_data in [
            {"id": 0, "name": "user", "description": "Basic user"},
            {"id": 1, "name": "seller", "description": "Can create and manage products"},
            {"id": 2, "name": "moderator", "description": "Can moderate content"},
            {"id": 3, "name": "admin", "description": "Can manage users and promote to moderator"},
            {"id": 4, "name": "super_admin", "description": "Full access"},
        ]:
            from sqlalchemy import select

            result = await db.execute(select(Role).where(Role.id == role_data["id"]))
            if not result.scalar_one_or_none():
                db.add(Role(**role_data))
        await db.commit()

        from sqlalchemy import select

        result = await db.execute(select(User).where(User.email == "admin@estore.com"))
        if not result.scalar_one_or_none():
            user = User(
                email="admin@estore.com",
                password_hash=get_password_hash("Admin123!"),
                first_name="Super",
                last_name="Admin",
                email_verified=True,
            )
            db.add(user)
            await db.flush()
            for role_id in [0, 1, 2, 3, 4]:
                db.add(UserRole(user_id=user.id, role_id=role_id))
            await db.commit()
            print("Super admin created: admin@estore.com / Admin123!")
        else:
            print("Admin already exists")


if __name__ == "__main__":
    asyncio.run(main())
