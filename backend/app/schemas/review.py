from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

class ActionItemCreate(BaseModel):
    description: str
    responsible_id: Optional[str] = None
    due_date: Optional[date] = None

class ActionItemOut(BaseModel):
    id: str
    description: str
    responsible_id: Optional[str]
    due_date: Optional[date]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class WeeklyReviewCreate(BaseModel):
    week_start_date: date
    scheduled_date: Optional[date] = None
    actual_meeting_date: Optional[date] = None
    goals_reviewed: Optional[str] = None
    major_challenges: Optional[str] = None
    decisions: Optional[str] = None
    meeting_notes: Optional[str] = None
    next_review_date: Optional[date] = None
    participant_ids: Optional[List[str]] = None
    action_items: Optional[List[ActionItemCreate]] = None

class WeeklyReviewUpdate(BaseModel):
    actual_meeting_date: Optional[date] = None
    conducted: Optional[bool] = None
    status: Optional[str] = None
    goals_reviewed: Optional[str] = None
    major_challenges: Optional[str] = None
    decisions: Optional[str] = None
    meeting_notes: Optional[str] = None
    next_review_date: Optional[date] = None

class WeeklyReviewOut(BaseModel):
    id: str
    week_start_date: date
    scheduled_date: Optional[date]
    actual_meeting_date: Optional[date]
    status: str
    conducted: bool
    goals_reviewed: Optional[str]
    major_challenges: Optional[str]
    decisions: Optional[str]
    meeting_notes: Optional[str]
    next_review_date: Optional[date]
    created_by: Optional[str]
    created_at: datetime
    action_items: List[ActionItemOut] = []

    class Config:
        from_attributes = True
