import pytest

from fastapi.testclient import TestClient
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker
from app.db.database import Base, get_db
from main import app

SQLALCHEMY_DATABASE_URL = (
    "sqlite:///./test.db"  # or "sqlite:///:memory:" for fresh DB every run
)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
Base.metadata.create_all(bind=engine)


def truncate_test_db():
    db = TestingSessionLocal()
    try:
        inspector = inspect(engine)
        table_names = inspector.get_table_names()
        for table in table_names:
            if table != "roles":
                db.execute(text(f"DELETE FROM {table}"))
        db.commit()
    finally:
        db.close()


# -----------------------------
# Pytest fixture for client
# -----------------------------
@pytest.fixture(scope="function")
def client():
    # Clean DB before tests
    truncate_test_db()

    with TestClient(app) as c:
        yield c
