from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError


class Base_Product:
    def __init__(self, model):
        self.model = model

    def create(self, obj_in: dict, db: Session, seller_id: int):
        try:
            db_obj = self.model(**obj_in, seller_id=seller_id)
            db.add(db_obj)
            db.commit()
            db.refresh(db_obj)

            return db_obj

        except IntegrityError:
            db.rollback()
            return None

    def get_all(self, db: Session):
        return db.query(self.model).all()

    def get_all_by_seller(self, db: Session, seller_id: int):
        return db.query(self.model).filter(self.model.seller_id == seller_id).all()

    def get(self, db: Session, product_id: int):
        return db.query(self.model).filter(self.model.id == product_id).first()

    def update(self, db: Session, product_id: int, obj_in: dict):
        obj = self.get(db, product_id)
        if obj:
            for field, value in obj_in.items():
                if value is not None:
                    setattr(obj, field, value)
            db.commit()
            db.refresh(obj)
        return obj

    #   dont forget to delete the product variant and product image when deleting the product
    def delete(self, db: Session, product_id: int) -> bool:
        obj = self.get(db, product_id)

        if not obj:
            return False

        db.delete(obj)
        db.commit()

        return True
