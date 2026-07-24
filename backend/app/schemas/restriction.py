from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel


class RestrictionReasonResponse(BaseModel):
    id: int
    reason_text: str

    model_config = {"from_attributes": True}


class RestrictionReasonCreate(BaseModel):
    reason_text: str


class CreateRestrictionRequest(BaseModel):
    reason_id: int
    report_id: int | None = None
    description: str | None = None
    penalty_days: int | None = None
    subvariant_ids: list[int] = []


class AppealCreate(BaseModel):
    restriction_id: int
    reason_text: str


class AppealResponse(BaseModel):
    id: int
    restriction_id: int
    appeal_text: str
    status: str
    created_at: datetime
    reviewed_at: datetime | None

    model_config = {"from_attributes": True}


class RestrictionProductResponse(BaseModel):
    id: int
    subvariant_id: int | None
    version_snapshot: dict
    note: str | None

    model_config = {"from_attributes": True}


class RestrictionResponse(BaseModel):
    id: int
    user_id: int
    reason_id: int
    reason_text: str | None
    description: str | None
    penalty_days: int | None
    status: str
    products: list[RestrictionProductResponse]
    created_at: datetime
    lifted_at: datetime | None

    model_config = {"from_attributes": True}
