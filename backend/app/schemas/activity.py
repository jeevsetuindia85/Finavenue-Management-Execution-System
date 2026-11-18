from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from app.schemas.user import UserBrief

class ActivityBase(BaseModel):
    name: str
    description: Optional[str] = None
    goal_id: Optional[str] = None
    assigned_to: Optional[str] = None
    priority: str = "medium"
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    target_frequency: Optional[str] = None
    target_quantity: Optional[int] = None
    module: Optional[str] = None

class ActivityCreate(ActivityBase):
    pass

class ActivityUpdateSchema(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    assigned_to: Optional[str] = None
    priority: Optional[str] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    target_frequency: Optional[str] = None
    target_quantity: Optional[int] = None
    actual_quantity: Optional[int] = None
    status: Optional[str] = None
    evidence_notes: Optional[str] = None
    next_due_date: Optional[date] = None

class ActivityOut(ActivityBase):
    id: str
    activity_code: Optional[str] = None
    actual_quantity: int
    last_completed_date: Optional[date] = None
    next_due_date: Optional[date] = None
    status: str
    rag_status: str
    evidence_notes: Optional[str] = None
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    assignee: Optional[UserBrief] = None

    class Config:
        from_attributes = True

class ActivityUpdateOut(BaseModel):
    id: str
    activity_id: str
    updated_by: Optional[str] = None
    previous_status: Optional[str] = None
    new_status: Optional[str] = None
    previous_quantity: Optional[int] = None
    new_quantity: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
