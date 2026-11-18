from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User
from app.models.review import WeeklyReview, MeetingParticipant, ActionItem
from app.schemas.review import WeeklyReviewCreate, WeeklyReviewUpdate, WeeklyReviewOut

router = APIRouter(prefix="/reviews", tags=["Weekly Reviews"])

def get_next_saturday(from_date: date | None = None) -> date:
    d = from_date or date.today()
    days_ahead = 5 - d.weekday()  # Saturday is 5
    if days_ahead <= 0:
        days_ahead += 7
    return d + timedelta(days=days_ahead)

@router.get("/", response_model=List[WeeklyReviewOut])
async def list_reviews(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(WeeklyReview)
        .options(selectinload(WeeklyReview.action_items))
        .order_by(WeeklyReview.week_start_date.desc())
        .limit(20)
    )
    return result.scalars().all()

@router.post("/", response_model=WeeklyReviewOut, status_code=status.HTTP_201_CREATED)
async def create_review(
    review_in: WeeklyReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("management", "admin", "coordinator"))
):
    review = WeeklyReview(
        week_start_date=review_in.week_start_date,
        scheduled_date=review_in.scheduled_date or get_next_saturday(review_in.week_start_date),
        actual_meeting_date=review_in.actual_meeting_date,
        goals_reviewed=review_in.goals_reviewed,
        major_challenges=review_in.major_challenges,
        decisions=review_in.decisions,
        meeting_notes=review_in.meeting_notes,
        next_review_date=review_in.next_review_date,
        created_by=current_user.id,
        status="scheduled",
        conducted=False,
    )
    if review_in.actual_meeting_date:
        review.conducted = True
        review.status = "completed"
    
    db.add(review)
    await db.flush()
    
    if review_in.participant_ids:
        for uid in review_in.participant_ids:
            db.add(MeetingParticipant(weekly_review_id=review.id, user_id=uid, attended=True))
    
    if review_in.action_items:
        for ai in review_in.action_items:
            db.add(ActionItem(
                weekly_review_id=review.id,
                description=ai.description,
                responsible_id=ai.responsible_id,
                due_date=ai.due_date,
            ))
    
    await db.commit()
    result = await db.execute(
        select(WeeklyReview).options(selectinload(WeeklyReview.action_items)).where(WeeklyReview.id == review.id)
    )
    return result.scalar_one()

@router.patch("/{review_id}", response_model=WeeklyReviewOut)
async def update_review(
    review_id: str,
    review_in: WeeklyReviewUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("management", "admin", "coordinator"))
):
    result = await db.execute(select(WeeklyReview).where(WeeklyReview.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    update_data = review_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(review, field, value)
    
    if review.conducted and review.status != "completed":
        review.status = "completed"
    
    # Apply Saturday / Tuesday logic
    today = date.today()
    if not review.conducted and review.scheduled_date:
        if review.scheduled_date < today:
            # Check if past Tuesday
            tuesday = review.scheduled_date + timedelta(days=3)  # Sat + 3 = Tue
            if today > tuesday:
                review.status = "red_alert"
            else:
                review.status = "missed_saturday"
    
    await db.commit()
    result = await db.execute(
        select(WeeklyReview).options(selectinload(WeeklyReview.action_items)).where(WeeklyReview.id == review_id)
    )
    return result.scalar_one()

@router.post("/{review_id}/complete", response_model=WeeklyReviewOut)
async def complete_review(
    review_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("management", "admin", "coordinator"))
):
    result = await db.execute(select(WeeklyReview).where(WeeklyReview.id == review_id))
    review = result.scalar_one_or_none()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    
    review.conducted = True
    review.status = "completed"
    if not review.actual_meeting_date:
        review.actual_meeting_date = date.today()
    
    await db.commit()
    result = await db.execute(
        select(WeeklyReview).options(selectinload(WeeklyReview.action_items)).where(WeeklyReview.id == review_id)
    )
    return result.scalar_one()
