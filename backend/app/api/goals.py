from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User
from app.models.goal import Goal, GoalMilestone
from app.models.activity import Activity
from app.schemas.goal import GoalCreate, GoalUpdate, GoalOut, GoalSummary, GoalMilestoneCreate

router = APIRouter(prefix="/goals", tags=["Goals"])

@router.get("/", response_model=List[GoalOut])
async def list_goals(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Goal).options(selectinload(Goal.owner), selectinload(Goal.milestones)).order_by(Goal.goal_code)
    )
    return result.scalars().all()

@router.post("/", response_model=GoalOut, status_code=status.HTTP_201_CREATED)
async def create_goal(
    goal_in: GoalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("management", "admin", "goal_owner"))
):
    # Check unique code
    existing = await db.execute(select(Goal).where(Goal.goal_code == goal_in.goal_code))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Goal code already exists")
    
    goal = Goal(
        goal_code=goal_in.goal_code,
        name=goal_in.name,
        description=goal_in.description,
        annual_target=goal_in.annual_target,
        start_date=goal_in.start_date,
        target_completion_date=goal_in.target_completion_date,
        owner_id=goal_in.owner_id,
        priority=goal_in.priority,
        status=goal_in.status,
        review_frequency=goal_in.review_frequency,
        created_by=current_user.id,
    )
    db.add(goal)
    await db.flush()
    
    if goal_in.milestones:
        for m in goal_in.milestones:
            milestone = GoalMilestone(
                goal_id=goal.id,
                name=m.name,
                description=m.description,
                target_date=m.target_date,
                status=m.status,
                owner_id=m.owner_id,
                completion_percentage=m.completion_percentage,
                sort_order=m.sort_order,
            )
            db.add(milestone)
    
    await db.commit()
    result = await db.execute(
        select(Goal).options(selectinload(Goal.owner), selectinload(Goal.milestones)).where(Goal.id == goal.id)
    )
    return result.scalar_one()

@router.get("/{goal_id}", response_model=GoalOut)
async def get_goal(
    goal_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(Goal).options(selectinload(Goal.owner), selectinload(Goal.milestones)).where(Goal.id == goal_id)
    )
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    return goal

@router.patch("/{goal_id}", response_model=GoalOut)
async def update_goal(
    goal_id: str,
    goal_in: GoalUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("management", "admin", "goal_owner"))
):
    result = await db.execute(select(Goal).where(Goal.id == goal_id))
    goal = result.scalar_one_or_none()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    
    update_data = goal_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(goal, field, value)
    
    await db.commit()
    result = await db.execute(
        select(Goal).options(selectinload(Goal.owner), selectinload(Goal.milestones)).where(Goal.id == goal_id)
    )
    return result.scalar_one()

@router.get("/summaries/list", response_model=List[GoalSummary])
async def goal_summaries(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    goals_result = await db.execute(
        select(Goal).options(selectinload(Goal.owner)).where(Goal.status != "archived")
    )
    goals = goals_result.scalars().all()
    summaries = []
    for g in goals:
        # Activity counts
        act_result = await db.execute(
            select(
                func.count(Activity.id).label("total"),
                func.count(Activity.id).filter(Activity.status == "completed").label("completed"),
                func.count(Activity.id).filter(
                    (Activity.due_date < func.current_date()) & (Activity.status != "completed")
                ).label("overdue")
            ).where(Activity.goal_id == g.id)
        )
        counts = act_result.one()
        
        # Milestone %
        ms_result = await db.execute(
            select(func.avg(GoalMilestone.completion_percentage)).where(GoalMilestone.goal_id == g.id)
        )
        ms_pct = ms_result.scalar() or 0.0
        
        summaries.append(GoalSummary(
            id=g.id,
            goal_code=g.goal_code,
            name=g.name,
            status=g.status,
            priority=g.priority,
            owner_name=g.owner.full_name if g.owner else None,
            target_completion_date=g.target_completion_date,
            activities_total=counts.total or 0,
            activities_completed=counts.completed or 0,
            activities_overdue=counts.overdue or 0,
            milestone_completion_pct=float(ms_pct),
            last_updated=g.updated_at,
        ))
    return summaries
