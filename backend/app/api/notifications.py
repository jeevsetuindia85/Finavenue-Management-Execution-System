from datetime import datetime, date, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, update, func

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.notification import Notification
from app.models.activity import Activity
from app.models.review import WeeklyReview
from app.models.hiring import HiringAgency
from app.schemas.notification import NotificationOut, NotificationCountOut

router = APIRouter(prefix="/notifications", tags=["Notification Engine"])

@router.get("/", response_model=List[NotificationOut])
async def list_notifications(
    unread_only: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Notification).where(Notification.user_id == current_user.id)
    if unread_only:
        query = query.where(Notification.is_read == False)
    query = query.order_by(Notification.created_at.desc()).limit(50)
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/count", response_model=NotificationCountOut)
async def get_notification_counts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    unread_q = await db.execute(
        select(func.count(Notification.id)).where(
            and_(Notification.user_id == current_user.id, Notification.is_read == False)
        )
    )
    total_q = await db.execute(
        select(func.count(Notification.id)).where(Notification.user_id == current_user.id)
    )
    return NotificationCountOut(
        unread_count=unread_q.scalar() or 0,
        total_count=total_q.scalar() or 0
    )

@router.post("/{notification_id}/read", response_model=NotificationOut)
async def mark_notification_read(
    notification_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Notification).where(
            and_(Notification.id == notification_id, Notification.user_id == current_user.id)
        )
    )
    notif = result.scalar_one_or_none()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    await db.commit()
    await db.refresh(notif)
    return notif

@router.post("/read-all")
async def mark_all_notifications_read(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await db.execute(
        update(Notification)
        .where(Notification.user_id == current_user.id)
        .values(is_read=True)
    )
    await db.commit()
    return {"status": "success", "message": "All notifications marked as read."}

@router.post("/trigger-rules")
async def trigger_notification_rules(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    created_count = 0
    
    # 1. Check for overdue activities
    overdue_q = await db.execute(
        select(Activity).where(and_(Activity.due_date < today, Activity.status != "completed"))
    )
    for act in overdue_q.scalars().all():
        if act.assigned_to:
            # Check if notification already exists
            existing = await db.execute(
                select(Notification).where(
                    and_(
                        Notification.user_id == act.assigned_to,
                        Notification.related_entity_id == act.id,
                        Notification.type == "overdue"
                    )
                )
            )
            if not existing.scalar_one_or_none():
                db.add(Notification(
                    user_id=act.assigned_to,
                    title="Task Overdue Alert",
                    message=f"Activity '{act.name}' was due on {act.due_date}.",
                    type="overdue",
                    related_entity_type="activity",
                    related_entity_id=act.id,
                ))
                created_count += 1
                
    # 2. Check for underperforming agencies
    ag_q = await db.execute(select(HiringAgency).where(HiringAgency.status == "underperforming"))
    for ag in ag_q.scalars().all():
        recipient_id = ag.followup_owner_id or current_user.id
        existing = await db.execute(
            select(Notification).where(
                and_(
                    Notification.user_id == recipient_id,
                    Notification.related_entity_id == ag.id,
                    Notification.type == "agency_no_cv"
                )
            )
        )
        if not existing.scalar_one_or_none():
            db.add(Notification(
                user_id=recipient_id,
                title="Agency Follow-up Required",
                message=f"Agency '{ag.name}' is underperforming: {ag.reason_for_no_cv or 'No CVs received'}.",
                type="agency_no_cv",
                related_entity_type="hiring_agency",
                related_entity_id=ag.id,
            ))
            created_count += 1
            
    await db.commit()
    return {"status": "success", "notifications_generated": created_count}
