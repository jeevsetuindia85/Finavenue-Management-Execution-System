from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import date, datetime
from app.schemas.user import UserBrief

class GoalMilestoneBase(BaseModel):
    name: str
    description: Optional[str] = None
    target_date: Optional[date] = None
    status: str = "pending"
    owner_id: Optional[str] = None
    completion_percentage: float = 0.0
    sort_order: int = 0

class GoalMilestoneCreate(GoalMilestoneBase):
    pass

class GoalMilestoneOut(GoalMilestoneBase):
    id: str
    goal_id: str
    actual_date: Optional[date] = None
    created_at: datetime

    class Config:
        from_attributes = True

class GoalBase(BaseModel):
    goal_code: str
    name: str
    description: Optional[str] = None
    annual_target: Optional[str] = None
    start_date: Optional[date] = None
    target_completion_date: Optional[date] = None
    owner_id: Optional[str] = None
    priority: str = "medium"
    status: str = "not_started"
    review_frequency: str = "weekly"

class GoalCreate(GoalBase):
    milestones: Optional[List[GoalMilestoneCreate]] = None

class GoalUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    annual_target: Optional[str] = None
    start_date: Optional[date] = None
    target_completion_date: Optional[date] = None
    owner_id: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    review_frequency: Optional[str] = None

class GoalOut(GoalBase):
    id: str
    created_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    owner: Optional[UserBrief] = None
    milestones: List[GoalMilestoneOut] = []

    class Config:
        from_attributes = True

class GoalSummary(BaseModel):
    id: str
    goal_code: str
    name: str
    status: str
    priority: str
    owner_name: Optional[str] = None
    target_completion_date: Optional[date] = None
    activities_total: int = 0
    activities_completed: int = 0
    activities_overdue: int = 0
    milestone_completion_pct: float = 0.0
    last_updated: Optional[datetime] = None

    class Config:
        from_attributes = True
