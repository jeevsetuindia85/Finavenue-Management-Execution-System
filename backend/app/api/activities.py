from datetime import date, datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.activity import Activity, ActivityUpdate, RAGStatus
from app.schemas.activity import ActivityCreate, ActivityUpdateSchema, ActivityOut, ActivityUpdateOut

router = APIRouter(prefix="/activities", tags=["Activities"])

def compute_rag(activity: Activity) -> str:
    today = date.today()
    if activity.status == "completed":
        return RAGStatus.GREEN.value
    if activity.due_date and activity.due_date < today and activity.status != "completed":
        return RAGStatus.RED.value
    if activity.due_date and (activity.due_date - today).days <= 3:
        return RAGStatus.AMBER.value
    if activity.status == "in_progress":
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
    query = select(Activity).options(selectinload(Activity.assignee))
    
    filters = []
    if goal_id:
        filters.append(Activity.goal_id == goal_id)
    if assigned_to:
        filters.append(Activity.assigned_to == assigned_to)
    if status:
        filters.append(Activity.status == status)
    if my_tasks:
        filters.append(Activity.assigned_to == current_user.id)
    
    today = date.today()
    if due == "today":
        filters.append(Activity.due_date == today)
    elif due == "this_week":
        # Simple: next 7 days
        from datetime import timedelta
        filters.append(and_(Activity.due_date >= today, Activity.due_date <= today + timedelta(days=7)))
    elif due == "overdue":
        filters.append(and_(Activity.due_date < today, Activity.status != "completed"))
    
    if filters:
        query = query.where(and_(*filters))
    
    query = query.order_by(Activity.due_date.nulls_last(), Activity.priority.desc())
    result = await db.execute(query)
    activities = result.scalars().all()
    
    # Ensure RAG is up to date
    for a in activities:
        a.rag_status = compute_rag(a)
    
    return activities

@router.post("/", response_model=ActivityOut, status_code=status.HTTP_201_CREATED)
async def create_activity(
    activity_in: ActivityCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    activity = Activity(
        **activity_in.model_dump(),
        created_by=current_user.id,
        rag_status=RAGStatus.GREY.value,
    )
    if activity.due_date:
        activity.next_due_date = activity.due_date
    activity.rag_status = compute_rag(activity)
    
    db.add(activity)
    await db.commit()
    await db.refresh(activity)
    
    result = await db.execute(
        select(Activity).options(selectinload(Activity.assignee)).where(Activity.id == activity.id)
    )
    return result.scalar_one()

@router.get("/{activity_id}", response_model=ActivityOut)
async def get_activity(
    activity_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Activity).options(selectinload(Activity.assignee)).where(Activity.id == activity_id)
    )
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    activity.rag_status = compute_rag(activity)
    return activity

@router.patch("/{activity_id}", response_model=ActivityOut)
async def update_activity(
    activity_id: str,
    activity_in: ActivityUpdateSchema,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Activity).where(Activity.id == activity_id))
    activity = result.scalar_one_or_none()
    if not activity:
        raise HTTPException(status_code=404, detail="Activity not found")
    
    # Permission: assignee, creator, coordinator, management, admin
    allowed = (
        current_user.id in (activity.assigned_to, activity.created_by) or
        current_user.role in ("management", "admin", "coordinator", "goal_owner")
    )
    if not allowed:
        raise HTTPException(status_code=403, detail="Not authorized to update this activity")
    
    old_status = activity.status
    old_qty = activity.actual_quantity
    
    update_data = activity_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(activity, field, value)
    
    if activity.status == "completed" and not activity.last_completed_date:
        activity.last_completed_date = date.today()
    
    activity.rag_status = compute_rag(activity)
    
    # Audit update
    update_record = ActivityUpdate(
        activity_id=activity.id,
        updated_by=current_user.id,
        previous_status=old_status,
        new_status=activity.status,
        previous_quantity=old_qty,
        new_quantity=activity.actual_quantity,
        notes=activity_in.evidence_notes,
    )
    db.add(update_record)
    
    await db.commit()
    
    result = await db.execute(
        select(Activity).options(selectinload(Activity.assignee)).where(Activity.id == activity_id)
    )
    return result.scalar_one()

@router.get("/{activity_id}/history", response_model=List[ActivityUpdateOut])
async def activity_history(
    activity_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(ActivityUpdate).where(ActivityUpdate.activity_id == activity_id).order_by(ActivityUpdate.created_at.desc())
    )
    return result.scalars().all()
