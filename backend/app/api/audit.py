from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User
from app.models.audit import AuditLog, LoginSession

router = APIRouter(prefix="/audit", tags=["Audit Trail & Activity Monitoring"])

def is_admin(user: User) -> bool:
    return user.role in ("admin", "management")

class AuditLogOut(BaseModel):
    id: str
    user_id: Optional[str] = None
    user_name: Optional[str] = None
    employee_id: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    ip_address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class LoginSessionOut(BaseModel):
    id: str
    user_id: str
    user_name: Optional[str] = None
    employee_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    login_at: datetime
    logout_at: Optional[datetime] = None
    status: str

    class Config:
        from_attributes = True

@router.get("/", response_model=List[AuditLogOut])
async def list_audit_logs(
    entity_type: Optional[str] = None,
    entity_id: Optional[str] = None,
    user_id: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Admin privileges required to view system audit logs."
        )
        
    query = select(AuditLog).options(selectinload(AuditLog.user))
    filters = []
    if entity_type:
        filters.append(AuditLog.entity_type == entity_type)
    if entity_id:
        filters.append(AuditLog.entity_id == entity_id)
    if user_id:
        filters.append(AuditLog.user_id == user_id)
    if filters:
        query = query.where(and_(*filters))
        
    query = query.order_by(AuditLog.created_at.desc()).limit(limit)
    result = await db.execute(query)
    logs = result.scalars().all()
    
    out = []
    for l in logs:
        out.append(AuditLogOut(
            id=l.id,
            user_id=l.user_id,
            user_name=l.user.full_name if l.user else "System",
            employee_id=l.user.employee_id if l.user else "SYS",
            action=l.action,
            entity_type=l.entity_type,
            entity_id=l.entity_id,
            old_value=l.old_value,
            new_value=l.new_value,
            ip_address=l.ip_address,
            created_at=l.created_at
        ))
    return out

@router.get("/sessions", response_model=List[LoginSessionOut])
async def list_login_sessions(
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Admin privileges required to view login sessions."
        )
        
    query = select(LoginSession).options(selectinload(LoginSession.user)).order_by(LoginSession.login_at.desc()).limit(limit)
    result = await db.execute(query)
    sessions = result.scalars().all()
    
    out = []
    for s in sessions:
        out.append(LoginSessionOut(
            id=s.id,
            user_id=s.user_id,
            user_name=s.user.full_name if s.user else "Unknown",
            employee_id=s.user.employee_id if s.user else "N/A",
            ip_address=s.ip_address,
            user_agent=s.user_agent,
            login_at=s.login_at,
            logout_at=s.logout_at,
            status=s.status
        ))
    return out
