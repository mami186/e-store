from sqlalchemy.orm import Session
from app.models.models import UserRole


from app.utils.auth import get_password_hash

class Base_Seller:
    def __init__(self, model):
        self.model = model


    def create(self, obj_in: dict , db: Session):
        db_obj = self.model(**obj_in)
        db.add(db_obj)
        db.flush() 

        user_role = UserRole(
            user_id=db_obj.id,
            role_id=1,
            assigned_by=None
        )
        db.add(user_role)

        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get(self, db: Session, obj_id: int):
        return db.query(self.model).join(UserRole, UserRole.user_id == self.model.id).filter(self.model.id == obj_id, UserRole.role_id == 1).first()

    def get_all(self, db: Session):
        return db.query(self.model).join(UserRole, UserRole.user_id == self.model.id).filter(UserRole.role_id == 1).all()

    def delete(self, db: Session, obj_id: int):
        obj = self.get(db, obj_id)
        if obj:
            db.delete(obj)
            db.commit()
        return obj
    def update(self, db: Session, obj_id: int, obj_in: dict):
        obj = self.get(db, obj_id)
        if obj:
            for field, value in obj_in.items():
                setattr(obj, field, value)
            db.commit()
            db.refresh(obj)
        return obj  

    def get_by_email(self, db: Session, email: str):
        return db.query(self.model).join(UserRole).filter(self.model.email == email, UserRole.role_id == 1).first()

    def get_by_username(self, db: Session, username: str):
        return db.query(self.model).join(UserRole).filter(self.model.username == username, UserRole.role_id == 1).first() 

    def update_password(self, db: Session, obj_id: int, password: str):
        obj = self.get(db, obj_id)
        if obj:
            obj.password_hash = get_password_hash(password)
            db.commit()
            db.refresh(obj)
        return obj