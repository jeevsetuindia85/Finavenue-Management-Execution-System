from datetime import datetime
from typing import Optional
from pydantic import BaseModel

class NotificationOut(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: str
    related_entity_type: Optional[str] = None
    related_entity_id: Optional[str] = None
    is_read: bool = False
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationCountOut(BaseModel):
    unread_count: int
    total_count: int
