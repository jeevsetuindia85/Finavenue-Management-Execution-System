from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class UserBase(BaseModel):
    email: str
    full_name: str
    role: str = "team_member"
    employee_id: Optional[str] = None
    username: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    phone: Optional[str] = None
    job_title: Optional[str] = None
    status: Optional[str] = "active"

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)
    permissions_json: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    employee_id: Optional[str] = None
    username: Optional[str] = None
    department: Optional[str] = None
    designation: Optional[str] = None
    phone: Optional[str] = None
    job_title: Optional[str] = None
    status: Optional[str] = None
    is_active: Optional[bool] = None
    avatar_url: Optional[str] = None
    permissions_json: Optional[str] = None

class ResetPasswordRequest(BaseModel):
    new_password: str = Field(..., min_length=6)

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)

class UserOut(UserBase):
    id: str
    is_active: bool
    avatar_url: Optional[str] = None
    permissions_json: Optional[str] = None
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

class UserBrief(BaseModel):
    id: str
    employee_id: Optional[str] = None
    full_name: str
    email: str
    role: str
    department: Optional[str] = None
    designation: Optional[str] = None
    status: Optional[str] = "active"

    class Config:
        from_attributes = True
