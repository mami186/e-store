from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.models.models import UserRole
from app.utils.auth import get_password_hash ,verify_password


class Base_User:
    def __init__(self, model):
        self.model = model


    def create(self, obj_in: dict, db: Session):
        try:
            db_obj = self.model(**obj_in)
            db.add(db_obj)
            db.flush()  # get user id without commit

            # assign default role
            user_role = UserRole(
                user_id=db_obj.id,
                role_id=0,  # default role
                assigned_by=None
            )
            db.add(user_role)

            db.commit()
            db.refresh(db_obj)

            return db_obj

        except IntegrityError:
            db.rollback()
            return None


    def get_all(self, db: Session):
        return db.query(self.model).all()

    def get(self, db: Session, obj_id: int):
        return db.query(self.model).filter(self.model.id == obj_id).first()

    def delete(self, db: Session, obj_id: int) -> bool:
        obj = self.get(db, obj_id)

        if not obj:
            return False

        db.delete(obj)
        db.commit()

        return True

    def update(self, db: Session, obj_id: int, obj_in: dict):
        obj = self.get(db, obj_id)
        if obj:
            for field, value in obj_in.items():
                setattr(obj, field, value)
            db.commit()
            db.refresh(obj)
        return obj

    def get_by_email(self, db: Session, email: str):
        return db.query(self.model).filter(self.model.email == email).first()

    def get_by_username(self, db: Session, username: str):
        return db.query(self.model).filter(self.model.username == username).first()

def update_password(self,db: Session,obj_id: int,new_password: str,old_password: str):

    obj = self.get(db, obj_id)
    if not obj:
        return None  # user not found

    if not verify_password(old_password, obj.password_hash):
        return False  # wrong old password

    obj.password_hash = get_password_hash(new_password)

    db.commit()
    db.refresh(obj)

    return obj