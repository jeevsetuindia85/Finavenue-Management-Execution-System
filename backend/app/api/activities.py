import os
import uuid
import json
from datetime import date, datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.core.database import get_db
from app.core.config import settings
from app.core.security import get_current_user
from app.models.user import User
from app.models.activity import Activity, ActivityUpdate, RAGStatus, ActivityStatus, TaskAttachment, Comment
from app.models.audit import AuditLog
from app.models.notification import Notification
from app.schemas.activity import (
    ActivityCreate, ActivityUpdateSchema, ActivityOut, 
    TaskSubmitRequest, TaskReviewRequest, TaskAttachmentOut
)

router = APIRouter(prefix="/activities", tags=["Tasks & Activities"])

def is_admin(user: User) -> bool:
    return user.role in ("admin", "management")

def compute_rag(activity: Activity) -> str:
    today = date.today()
    if activity.status == "completed":
        return RAGStatus.GREEN.value
    if activity.due_date and activity.due_date < today and activity.status != "completed":
        return RAGStatus.RED.value
    if activity.due_date and (activity.due_date - today).days <= 3:
        return RAGStatus.AMBER.value
    if activity.status in ("in_progress", "under_review"):
        return RAGStatus.AMBER.value
    if not activity.due_date or activity.due_date > today:
        return RAGStatus.GREY.value
    return RAGStatus.AMBER.value

@router.get("/", response_model=List[ActivityOut])
async def list_activities(
    goal_id: Optional[str] = None,
    assigned_to: Optional[str] = None,
    status: Optional[str] = None,
    due: Optional[str] = None,  # today / this_week / overdue
    my_tasks: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Activity).options(
        selectinload(Activity.assignee),
        selectinload(Activity.attachments)
    )
    
    filters = []
    
    # STRICT PRIVACY & DATA ISOLATION RULE:
    # Team members can NEVER view tasks assigned to other employees!
    if not is_admin(current_user):
        filters.append(Activity.assigned_to == current_user.id)
    else:
        # Admin can view all or filter by specific employee
        if my_tasks:
            filters.append(Activity.assigned_to == current_user.id)
        elif assigned_to:
            filters.append(Activity.assigned_to == assigned_to)
            
    if goal_id:
        filters.append(Activity.goal_id == goal_id)
    if status:
        filters.append(Activity.status == status)
    
    today = date.today()
    if due == "today":
        filters.append(Activity.due_date == today)
    elif due == "this_week":
        filters.append(and_(Activity.due_date >= today, Activity.due_date <= today + timedelta(days=7)))
    elif due == "overdue":
        filters.append(and_(Activity.due_date < today, Activity.status != "completed"))
        
    if filters:
        query = query.where(and_(*filters))
        
    query = query.order_by(Activity.due_date.asc().nulls_last(), Activity.created_at.desc())
    result = await db.execute(query)
    activities = result.scalars().all()
    
    for a in activities:
        a.rag_status = compute_rag(a)
    
    return activities

@router.post("/", response_model=ActivityOut, status_code=status.HTTP_201_CREATED)
async def create_task(
    activity_in: ActivityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only Admin / Management can create and allocate tasks
    if not is_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: Only Administrators can create and assign tasks."
        )
        
    activity = Activity(
        **activity_in.model_dump(),
        created_by=current_user.id,
        status=ActivityStatus.ASSIGNED.value,
        rag_status=RAGStatus.GREY.value,
    )
    if activity.due_date:
        activity.next_due_date = activity.due_date
    activity.rag_status = compute_rag(activity)
    
    db.add(activity)
    await db.commit()
    await db.refresh(activity)
    
    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="create_task",
        entity_type="activity",
        entity_id=activity.id,
        new_value=json.dumps({"name": activity.name, "assigned_to": activity.assigned_to})
    )
    db.add(audit)
    
    # Notify assigned employee
    if activity.assigned_to:
        notif = Notification(
            user_id=activity.assigned_to,
            title="New Task Assigned",
            message=f"Admin assigned you a new task: {activity.name}",
            type="task_assignment",
            related_entity_type="activity",
            related_entity_id=activity.id
        )
        db.add(notif)
    
    await db.commit()
    
    result = await db.execute(
        select(Activity).options(
            selectinload(Activity.assignee),
            selectinload(Activity.attachments)
        ).where(Activity.id == activity.id)
    )
    return result.scalar_one()

@router.get("/{activity_id}", response_model=ActivityOut)
async def get_task_detail(
    activity_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Activity).options(
            selectinload(Activity.assignee),
            selectinload(Activity.attachments)
        ).where(Activity.id == activity_id)
    )
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Task not found")
        
    # STRICT PRIVACY: Team member can ONLY view their own assigned task
    if not is_admin(current_user) and activity.assigned_to != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied: You are not authorized to view other team members' tasks."
        )
        
    activity.rag_status = compute_rag(activity)
    return activity

@router.patch("/{activity_id}", response_model=ActivityOut)
async def update_task(
    activity_id: str,
    activity_in: ActivityUpdateSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Activity).options(
            selectinload(Activity.assignee),
            selectinload(Activity.attachments)
        ).where(Activity.id == activity_id)
    )
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Task not found")
        
    # Check permissions
    if not is_admin(current_user):
        if activity.assigned_to != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You cannot edit another employee's task."
            )
        # Employees cannot reassign or change priority or directly approve
        update_dict = activity_in.model_dump(exclude_unset=True)
        allowed_for_employee = {"actual_quantity", "status", "evidence_notes", "submission_notes"}
        for k in list(update_dict.keys()):
            if k not in allowed_for_employee:
                del update_dict[k]
                
        # Employees can only set status to in_progress or under_review
        if "status" in update_dict and update_dict["status"] not in ("assigned", "in_progress", "under_review"):
            del update_dict["status"]
    else:
        update_dict = activity_in.model_dump(exclude_unset=True)
        
    old_status = activity.status
    old_qty = activity.actual_quantity
    
    for field, val in update_dict.items():
        setattr(activity, field, val)
        
    if activity.status == "completed" and old_status != "completed":
        activity.last_completed_date = date.today()
        
    activity.rag_status = compute_rag(activity)
    
    # Record Activity Update record
    upd = ActivityUpdate(
        activity_id=activity.id,
        updated_by=current_user.id,
        previous_status=old_status,
        new_status=activity.status,
        previous_quantity=old_qty,
        new_quantity=activity.actual_quantity,
        notes=activity.evidence_notes or activity.submission_notes
    )
    db.add(upd)
    
    # Record Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="update_task",
        entity_type="activity",
        entity_id=activity.id,
        new_value=json.dumps(update_dict, default=str)
    )
    db.add(audit)
    
    await db.commit()
    await db.refresh(activity)
    return activity

@router.post("/{activity_id}/submit")
async def submit_task_for_review(
    activity_id: str,
    req: TaskSubmitRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if not is_admin(current_user) and activity.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied: Cannot submit another employee's task.")
        
    activity.status = ActivityStatus.UNDER_REVIEW.value
    activity.submission_notes = req.submission_notes
    activity.submitted_at = datetime.now(timezone.utc)
    if req.actual_quantity is not None:
        activity.actual_quantity = req.actual_quantity
    activity.rag_status = compute_rag(activity)
    
    # Notify Admin
    # Find admin users
    admins_res = await db.execute(select(User).where(User.role.in_(("admin", "management"))))
    for adm in admins_res.scalars().all():
        notif = Notification(
            user_id=adm.id,
            title="Work Submitted for Review",
            message=f"{current_user.full_name} submitted work for review: '{activity.name}'",
            type="task_submitted",
            related_entity_type="activity",
            related_entity_id=activity.id
        )
        db.add(notif)
        
    audit = AuditLog(
        user_id=current_user.id,
        action="submit_work",
        entity_type="activity",
        entity_id=activity.id,
        new_value=json.dumps({"notes": req.submission_notes})
    )
    db.add(audit)
    
    await db.commit()
    return {"message": "Task submitted for Admin review successfully.", "status": activity.status}

@router.post("/{activity_id}/review")
async def admin_review_task(
    activity_id: str,
    req: TaskReviewRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Access denied: Only Administrators can review and approve tasks.")
        
    result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Task not found")
        
    action_type = req.action.lower()
    if action_type == "approve":
        activity.status = ActivityStatus.COMPLETED.value
        activity.approved_at = datetime.now(timezone.utc)
        activity.approved_by = current_user.id
        activity.admin_feedback = req.feedback or "Approved by Admin"
        activity.last_completed_date = date.today()
        msg_title = "Task Approved 🎉"
        msg_body = f"Admin approved your task '{activity.name}'!"
    elif action_type in ("reject", "request_changes"):
        activity.status = ActivityStatus.ON_HOLD.value
        activity.admin_feedback = req.feedback or "Changes requested by Admin"
        msg_title = "Task Feedback / Changes Requested"
        msg_body = f"Admin requested changes on task '{activity.name}': {req.feedback}"
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'approve' or 'reject'.")
        
    activity.rag_status = compute_rag(activity)
    
    # Notify assigned employee
    if activity.assigned_to:
        notif = Notification(
            user_id=activity.assigned_to,
            title=msg_title,
            message=msg_body,
            type=f"task_{action_type}",
            related_entity_type="activity",
            related_entity_id=activity.id
        )
        db.add(notif)
        
    audit = AuditLog(
        user_id=current_user.id,
        action=f"review_{action_type}",
        entity_type="activity",
        entity_id=activity.id,
        new_value=json.dumps({"feedback": req.feedback, "status": activity.status})
    )
    db.add(audit)
    
    await db.commit()
    return {"message": f"Task {action_type}d successfully.", "status": activity.status}

@router.post("/{activity_id}/attachments")
async def upload_task_attachment(
    activity_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if not is_admin(current_user) and activity.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied: Cannot upload files to another employee's task.")
        
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    safe_filename = f"{uuid.uuid4()}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)
    
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
        
    attachment = TaskAttachment(
        task_id=activity.id,
        uploaded_by=current_user.id,
        file_name=file.filename,
        file_path=f"/uploads/{safe_filename}",
        file_size=len(content),
        mime_type=file.content_type
    )
    db.add(attachment)
    await db.commit()
    await db.refresh(attachment)
    return {"message": "Attachment uploaded successfully", "attachment": attachment.file_name, "url": attachment.file_path}

@router.get("/{activity_id}/updates")
async def get_activity_updates(
    activity_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if not is_admin(current_user) and activity.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    res = await db.execute(
        select(ActivityUpdate).where(ActivityUpdate.activity_id == activity_id).order_by(ActivityUpdate.created_at.desc())
    )
    return res.scalars().all()

@router.post("/{activity_id}/comments")
async def add_task_comment(
    activity_id: str,
    content: str = Form(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if not is_admin(current_user) and activity.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    comm = Comment(
        entity_type="activity",
        entity_id=activity.id,
        user_id=current_user.id,
        content=content.strip()
    )
    db.add(comm)
    
    # Notify counterpart
    target_user_id = activity.assigned_to if is_admin(current_user) else activity.created_by
    if target_user_id and target_user_id != current_user.id:
        notif = Notification(
            user_id=target_user_id,
            title="New Comment on Task",
            message=f"{current_user.full_name} commented on '{activity.name}'",
            type="task_comment",
            related_entity_type="activity",
            related_entity_id=activity.id
        )
        db.add(notif)
        
    await db.commit()
    return {"message": "Comment added successfully"}

@router.get("/{activity_id}/comments")
async def list_task_comments(
    activity_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Task not found")
        
    if not is_admin(current_user) and activity.assigned_to != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
        
    res = await db.execute(
        select(Comment).where(Comment.entity_type == "activity", Comment.entity_id == activity_id).order_by(Comment.created_at.asc())
    )
    return res.scalars().all()
