from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: str
    full_name: str
    role: str = "team_member"
    phone: Optional[str] = None
    job_title: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    job_title: Optional[str] = None
    is_active: Optional[bool] = None
    avatar_url: Optional[str] = None

class UserOut(UserBase):
    id: str
    is_active: bool
    avatar_url: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserBrief(BaseModel):
    id: str
    full_name: str
    email: str
    role: str

    class Config:
        from_attributes = True
