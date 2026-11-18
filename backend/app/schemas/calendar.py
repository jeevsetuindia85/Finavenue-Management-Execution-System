from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel

class GoogleCalendarConnectionOut(BaseModel):
    is_connected: bool
    email: Optional[str] = None
    calendar_id: Optional[str] = None
    last_sync_at: Optional[datetime] = None
    is_active: bool = False

class CalendarEventCreate(BaseModel):
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    entity_type: str  # activity, review, interview, site_visit, milestone
    entity_id: str

class CalendarEventOut(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    location: Optional[str] = None
    entity_type: str
    entity_id: str
    google_event_id: Optional[str] = None
    sync_status: str = "synced"

class SyncResultOut(BaseModel):
    synced_count: int
    failed_count: int
    message: str
    events: List[CalendarEventOut] = []
