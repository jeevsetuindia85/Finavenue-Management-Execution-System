import uuid
import json
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from typing import List, Optional, Dict, Any

from app.core.database import get_db
from app.core.security import get_current_user, require_roles, get_password_hash
from app.models.user import User, UserRole, UserStatus
from app.models.activity import Activity
from app.models.audit import AuditLog
from app.schemas.user import (
    UserOut, UserCreate, UserUpdate, ResetPasswordRequest
)

router = APIRouter(prefix="/users", tags=["Users & Team Management"])

def is_admin(user: User) -> bool:
    return user.role in ("admin", "management")

@router.get("/", response_model=List[UserOut])
async def list_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only Admin / Management can view all users
    if not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Admin privileges required to view all employee records."
        )
    result = await db.execute(select(User).order_by(User.full_name))
    return result.scalars().all()

@router.get("/team-stats")
async def get_team_management_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Admin privileges required."
        )
        
    users_res = await db.execute(select(User))
    users = users_res.scalars().all()
    
    total_members = len(users)
    active_members = len([u for u in users if u.is_active and u.status == "active"])
    inactive_members = total_members - active_members
    
    # Per-employee task performance
    employee_performance = []
    for u in users:
        tasks_res = await db.execute(select(Activity).where(Activity.assigned_to == u.id))
        user_tasks = tasks_res.scalars().all()
        total_tasks = len(user_tasks)
        completed_tasks = len([t for t in user_tasks if t.status == "completed"])
        pending_tasks = len([t for t in user_tasks if t.status in ("assigned", "todo", "in_progress")])
        under_review_tasks = len([t for t in user_tasks if t.status == "under_review"])
        
        from datetime import date
        today = date.today()
        overdue_tasks = len([t for t in user_tasks if t.due_date and t.due_date < today and t.status != "completed"])
        
        productivity = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0.0
        
        employee_performance.append({
            "id": u.id,
            "employee_id": u.employee_id or f"FA-EMP-{str(u.id)[:4].upper()}",
            "name": u.full_name,
            "full_name": u.full_name,
            "email": u.email,
            "role": u.role,
            "department": u.department or "Operations",
            "designation": u.designation or u.job_title or "Team Member",
            "status": u.status or "active",
            "total_tasks": total_tasks,
            "assigned_count": total_tasks,
            "completed_tasks": completed_tasks,
            "completed_count": completed_tasks,
            "pending_tasks": pending_tasks,
            "pending_count": pending_tasks,
            "under_review_tasks": under_review_tasks,
            "under_review_count": under_review_tasks,
            "overdue_tasks": overdue_tasks,
            "overdue_count": overdue_tasks,
            "productivity_pct": productivity,
            "last_login": u.last_login.isoformat() if u.last_login else None
        })
        
    return {
        "summary": {
            "total_members": total_members,
            "active_members": active_members,
            "inactive_members": inactive_members,
        },
        "employees": employee_performance
    }

@router.post("/", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_employee_account(
    user_in: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Only Administrators can create team member accounts."
        )
        
    # Check email duplicate
    email_clean = user_in.email.strip().lower()
    res = await db.execute(select(User).where(User.email == email_clean))
    if res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
        
    # Check Employee ID duplicate or auto-generate
    emp_id = user_in.employee_id
    if not emp_id:
        count_res = await db.execute(select(func.count(User.id)))
        count = count_res.scalar() or 0
        emp_id = f"FA-EMP-{str(count + 1).zfill(3)}"
    else:
        emp_id = emp_id.strip().upper()
        res_emp = await db.execute(select(User).where(User.employee_id == emp_id))
        if res_emp.scalar_one_or_none():
            raise HTTPException(status_code=400, detail=f"Employee ID {emp_id} is already in use.")

    # Generate username if not provided
    uname = user_in.username
    if not uname:
        base_uname = user_in.full_name.lower().replace(" ", ".")
        uname = base_uname
        res_u = await db.execute(select(User).where(User.username == uname))
        if res_u.scalar_one_or_none():
            uname = f"{base_uname}{str(uuid.uuid4())[:4]}"

    new_user = User(
        employee_id=emp_id,
        username=uname,
        email=email_clean,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name.strip(),
        role=user_in.role or UserRole.TEAM_MEMBER.value,
        department=user_in.department or "Operations",
        designation=user_in.designation or user_in.job_title or "Team Member",
        phone=user_in.phone,
        status=user_in.status or "active",
        is_active=True,
        must_change_password=True,
        permissions_json=user_in.permissions_json or '{"tasks": true, "submissions": true}'
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="create_employee",
        entity_type="user",
        entity_id=new_user.id,
        new_value=f'{{"email": "{new_user.email}", "employee_id": "{new_user.employee_id}", "role": "{new_user.role}"}}'
    )
    db.add(audit)
    await db.commit()
    
    return new_user

@router.get("/{user_id}", response_model=UserOut)
async def get_user_profile(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Team members can only view their own profile
    if not is_admin(current_user) and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You can only view your own user profile."
        )
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.patch("/{user_id}", response_model=UserOut)
async def update_employee_profile(
    user_id: str,
    user_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Only Administrators can edit employee profiles."
        )
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    update_data = user_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(user, field, value)
        
    await db.commit()
    await db.refresh(user)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="update_employee",
        entity_type="user",
        entity_id=user.id,
        new_value=json.dumps(update_data)
    )
    db.add(audit)
    await db.commit()
    
    return user

@router.post("/{user_id}/reset-password")
async def admin_reset_password(
    user_id: str,
    req: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Only Administrators can reset employee passwords."
        )
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.hashed_password = get_password_hash(req.new_password)
    user.must_change_password = True
    user.failed_login_attempts = 0
    user.locked_until = None
    await db.commit()
    
    audit = AuditLog(
        user_id=current_user.id,
        action="reset_password",
        entity_type="user",
        entity_id=user.id
    )
    db.add(audit)
    await db.commit()
    
    return {"message": f"Password for {user.full_name} ({user.employee_id}) has been reset successfully."}

@router.post("/{user_id}/toggle-status")
async def toggle_employee_status(
    user_id: str,
    status_val: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Only Administrators can modify employee account status."
        )
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own Admin account.")
        
    user.status = status_val
    user.is_active = (status_val == "active")
    await db.commit()
    
    audit = AuditLog(
        user_id=current_user.id,
        action="change_status",
        entity_type="user",
        entity_id=user.id,
        new_value=f'{{"status": "{status_val}"}}'
    )
    db.add(audit)
    await db.commit()
    
    return {"message": f"Employee {user.full_name} status updated to {status_val}."}

@router.delete("/{user_id}")
async def archive_or_delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Only Administrators can remove employee accounts."
        )
        
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own administrator account.")
        
    # Mark as archived to preserve historical task ownership and data integrity
    user.status = "archived"
    user.is_active = False
    await db.commit()
    
    audit = AuditLog(
        user_id=current_user.id,
        action="archive_user",
        entity_type="user",
        entity_id=user.id
    )
    db.add(audit)
    await db.commit()
    
    return {"message": f"Employee {user.full_name} ({user.employee_id}) archived successfully."}
