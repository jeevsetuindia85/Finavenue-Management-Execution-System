from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import date, datetime

class KPISummary(BaseModel):
    total_active_goals: int
    completed_goals: int
    goals_at_risk: int
    overdue_activities: int
    activities_due_this_week: int
    activities_completed_this_week: int
    pending_action_items: int
    weekly_review_compliance: float  # percentage

class GoalCard(BaseModel):
    id: str
    goal_code: str
    name: str
    owner_name: Optional[str]
    status: str
    target_completion_date: Optional[date]
    activities_completed: int
    activities_pending: int
    activities_overdue: int
    milestone_completion_pct: float
    last_updated: Optional[datetime]
    next_review_date: Optional[date]

class AlertItem(BaseModel):
    id: str
    type: str
    severity: str  # green / amber / red / grey
    title: str
    message: str
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[str] = None
    created_at: Optional[datetime] = None

class DashboardOut(BaseModel):
    kpis: KPISummary
    goal_cards: List[GoalCard]
    alerts: List[AlertItem]
    charts: Dict[str, Any] = {}  # for chart data payloads
