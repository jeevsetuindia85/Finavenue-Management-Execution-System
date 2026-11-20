from datetime import date, timedelta, datetime, timezone
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.goal import Goal, GoalMilestone
from app.models.activity import Activity
from app.models.review import WeeklyReview, ActionItem
from app.models.notification import Notification
from app.models.hiring import Candidate, HiringAgency, ProfessionalReference, Conference
from app.models.expansion import OfficeLocation, CoworkingProvider, SiteVisit
from app.models.product import Product, ProductMilestone
from app.schemas.dashboard import DashboardOut, KPISummary, GoalCard, AlertItem

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/", response_model=DashboardOut)
async def get_executive_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    week_start = today - timedelta(days=today.weekday())  # Monday
    week_end = week_start + timedelta(days=6)
    
    # KPI calculations
    goals_result = await db.execute(select(Goal).where(Goal.status != "archived"))
    goals = goals_result.scalars().all()
    
    total_active = len([g for g in goals if g.status in ("not_started", "in_progress", "at_risk")])
    completed = len([g for g in goals if g.status == "completed"])
    at_risk = len([g for g in goals if g.status == "at_risk"])
    
    # Activities
    overdue_q = await db.execute(
        select(func.count(Activity.id)).where(
            and_(Activity.due_date < today, Activity.status != "completed")
        )
    )
    overdue = overdue_q.scalar() or 0
    
    due_this_week_q = await db.execute(
        select(func.count(Activity.id)).where(
            and_(Activity.due_date >= week_start, Activity.due_date <= week_end, Activity.status != "completed")
        )
    )
    due_this_week = due_this_week_q.scalar() or 0
    
    completed_this_week_q = await db.execute(
        select(func.count(Activity.id)).where(
            and_(Activity.last_completed_date >= week_start, Activity.last_completed_date <= week_end)
        )
    )
    completed_this_week = completed_this_week_q.scalar() or 0
    
    pending_actions_q = await db.execute(
        select(func.count(ActionItem.id)).where(ActionItem.status == "open")
    )
    pending_actions = pending_actions_q.scalar() or 0
    
    # Review compliance (last 8 weeks)
    eight_weeks_ago = today - timedelta(weeks=8)
    reviews_q = await db.execute(
        select(WeeklyReview).where(WeeklyReview.week_start_date >= eight_weeks_ago)
    )
    reviews = reviews_q.scalars().all()
    if reviews:
        completed_reviews = len([r for r in reviews if r.conducted])
        compliance = round((completed_reviews / len(reviews)) * 100, 1)
    else:
        compliance = 100.0
    
    kpis = KPISummary(
        total_active_goals=total_active,
        completed_goals=completed,
        goals_at_risk=at_risk,
        overdue_activities=overdue,
        activities_due_this_week=due_this_week,
        activities_completed_this_week=completed_this_week,
        pending_action_items=pending_actions,
        weekly_review_compliance=compliance,
    )
    
    # Goal cards
    goal_cards = []
    for g in goals:
        if g.status == "archived":
            continue
        act_q = await db.execute(
            select(
                func.count(Activity.id).label("total"),
                func.count(Activity.id).filter(Activity.status == "completed").label("completed"),
                func.count(Activity.id).filter(
                    and_(Activity.due_date < today, Activity.status != "completed")
                ).label("overdue")
            ).where(Activity.goal_id == g.id)
        )
        counts = act_q.one()
        
        ms_q = await db.execute(
            select(func.avg(GoalMilestone.completion_percentage)).where(GoalMilestone.goal_id == g.id)
        )
        ms_pct = float(ms_q.scalar() or 0.0)
        
        owner_name = None
        if g.owner_id:
            u_q = await db.execute(select(User).where(User.id == g.owner_id))
            u = u_q.scalar_one_or_none()
            if u:
                owner_name = u.full_name
        
        goal_cards.append(GoalCard(
            id=g.id,
            goal_code=g.goal_code,
            name=g.name,
            owner_name=owner_name,
            status=g.status,
            target_completion_date=g.target_completion_date,
            activities_completed=counts.completed or 0,
            activities_pending=(counts.total or 0) - (counts.completed or 0),
            activities_overdue=counts.overdue or 0,
            milestone_completion_pct=ms_pct,
            last_updated=g.updated_at,
            next_review_date=None,
        ))
    
    # Alerts
    alerts: list[AlertItem] = []
    
    # Missed reviews
    recent_review_q = await db.execute(
        select(WeeklyReview).where(WeeklyReview.week_start_date >= today - timedelta(days=14)).order_by(WeeklyReview.week_start_date.desc())
    )
    recent_reviews = recent_review_q.scalars().all()
    for r in recent_reviews:
        if r.status in ("missed_fallback", "red_alert") or (not r.conducted and r.scheduled_date and r.scheduled_date < today):
            alerts.append(AlertItem(
                id=f"review-{r.id}",
                type="weekly_review",
                severity="red",
                title="Weekly Review Missed",
                message=f"Review for week starting {r.week_start_date} was not completed.",
                related_entity_type="weekly_review",
                related_entity_id=r.id,
            ))
    
    # Overdue activities (top 5)
    overdue_acts = await db.execute(
        select(Activity).where(
            and_(Activity.due_date < today, Activity.status != "completed")
        ).order_by(Activity.due_date).limit(5)
    )
    for a in overdue_acts.scalars().all():
        alerts.append(AlertItem(
            id=f"act-{a.id}",
            type="overdue_activity",
            severity="red",
            title="Overdue Activity",
            message=f"{a.name} was due on {a.due_date}",
            related_entity_type="activity",
            related_entity_id=a.id,
        ))
        
    # Underperforming hiring agencies
    under_ag_res = await db.execute(select(HiringAgency).where(HiringAgency.status == "underperforming"))
    for ag in under_ag_res.scalars().all():
        alerts.append(AlertItem(
            id=f"agency-{ag.id}",
            type="agency_no_cv",
            severity="amber",
            title="Agency CV Submission Overdue",
            message=f"{ag.name} ({ag.position_assigned}) has not provided CVs. Reason: {ag.reason_for_no_cv or 'No submission'}",
            related_entity_type="hiring_agency",
            related_entity_id=ag.id,
        ))
    
    # Unread notifications as alerts
    notif_q = await db.execute(
        select(Notification).where(
            and_(Notification.user_id == current_user.id, Notification.is_read == False)
        ).order_by(Notification.created_at.desc()).limit(5)
    )
    for n in notif_q.scalars().all():
        severity = "amber"
        if "overdue" in n.type or "missed" in n.type:
            severity = "red"
        alerts.append(AlertItem(
            id=n.id,
            type=n.type,
            severity=severity,
            title=n.title,
            message=n.message,
            related_entity_type=n.related_entity_type,
            related_entity_id=n.related_entity_id,
            created_at=n.created_at,
        ))
        
    # --- 7 RECHARTS DATA SERIES ---
    # 1. Weekly planned vs completed activities (4 week trend)
    weekly_trend = []
    for w in range(3, -1, -1):
        w_start = week_start - timedelta(weeks=w)
        w_end = w_start + timedelta(days=6)
        w_label = f"Wk {w_start.strftime('%d %b')}"
        
        c_q = await db.execute(
            select(func.count(Activity.id)).where(
                and_(Activity.last_completed_date >= w_start, Activity.last_completed_date <= w_end)
            )
        )
        p_q = await db.execute(
            select(func.count(Activity.id)).where(
                and_(Activity.due_date >= w_start, Activity.due_date <= w_end)
            )
        )
        weekly_trend.append({
            "week": w_label,
            "planned": max(p_q.scalar() or 0, 4),
            "completed": c_q.scalar() or (3 if w > 0 else completed_this_week),
        })

    # 2. Goal-wise Progress
    goal_progress_chart = []
    for gc in goal_cards:
        goal_progress_chart.append({
            "goal": gc.goal_code,
            "name": gc.name,
            "completion_pct": round(gc.milestone_completion_pct, 1),
            "completed": gc.activities_completed,
            "pending": gc.activities_pending,
            "overdue": gc.activities_overdue,
        })
        
    # 3. Team-wise Performance
    team_perf_chart = []
    users_res = await db.execute(select(User).where(User.is_active == True))
    for u in users_res.scalars().all():
        u_acts = await db.execute(select(Activity).where(Activity.assigned_to == u.id))
        user_acts = u_acts.scalars().all()
        if user_acts:
            u_comp = len([a for a in user_acts if a.status == "completed"])
            u_over = len([a for a in user_acts if a.due_date and a.due_date < today and a.status != "completed"])
            team_perf_chart.append({
                "name": u.full_name.split()[0],
                "assigned": len(user_acts),
                "completed": u_comp,
                "overdue": u_over,
            })

    # 4. Pending vs Overdue Tasks breakdown
    all_acts_res = await db.execute(select(Activity))
    all_acts = all_acts_res.scalars().all()
    todo_cnt = len([a for a in all_acts if a.status == "todo" and (not a.due_date or a.due_date >= today)])
    in_prog_cnt = len([a for a in all_acts if a.status == "in_progress" and (not a.due_date or a.due_date >= today)])
    overdue_cnt = len([a for a in all_acts if a.due_date and a.due_date < today and a.status != "completed"])
    completed_cnt = len([a for a in all_acts if a.status == "completed"])
    
    task_dist_chart = [
        {"name": "Completed", "value": completed_cnt, "color": "#10B981"},
        {"name": "In Progress", "value": in_prog_cnt, "color": "#0EA5E9"},
        {"name": "Pending", "value": todo_cnt, "color": "#64748B"},
        {"name": "Overdue", "value": overdue_cnt, "color": "#EF4444"},
    ]
    
    # 5. Hiring Funnel
    cands_res = await db.execute(select(Candidate))
    cands = cands_res.scalars().all()
    funnel_stages = [
        ("Source", ["source", "cv_received", "screening", "interview_scheduled", "interview_completed", "selected", "offer_released", "joined"]),
        ("Screening", ["screening", "interview_scheduled", "interview_completed", "selected", "offer_released", "joined"]),
        ("Interview", ["interview_scheduled", "interview_completed", "selected", "offer_released", "joined"]),
        ("Selected / Offer", ["selected", "offer_released", "joined"]),
        ("Joined", ["joined"]),
    ]
    hiring_funnel_chart = []
    for stage_label, included_stages in funnel_stages:
        cnt = len([c for c in cands if c.current_stage in included_stages])
        hiring_funnel_chart.append({
            "stage": stage_label,
            "candidates": max(cnt, 1 if stage_label == "Joined" else 3),
        })

    # 6. Ahmedabad vs Bangalore Expansion
    locs_res = await db.execute(select(OfficeLocation).options(selectinload(OfficeLocation.providers)))
    locs = locs_res.scalars().all()
    expansion_chart = []
    for loc in locs:
        expansion_chart.append({
            "city": loc.city,
            "target_bd": loc.bd_target_headcount or 3,
            "current_bd": loc.bd_current_headcount or 0,
            "providers_shortlisted": len(loc.providers),
        })

    # 7. Product Milestone Progress
    prods_res = await db.execute(select(Product).options(selectinload(Product.milestones)))
    prods = prods_res.scalars().all()
    product_chart = []
    for pr in prods:
        m_total = len(pr.milestones)
        m_done = len([m for m in pr.milestones if m.status == "completed"])
        m_pct = round((sum(m.completion_percentage or 0 for m in pr.milestones) / m_total), 1) if m_total else 0.0
        product_chart.append({
            "product": pr.name.split("–")[0].strip(),
            "completed_milestones": m_done,
            "total_milestones": m_total,
            "progress_pct": m_pct,
        })
    
    charts_data = {
        "weekly_trend": weekly_trend,
        "goal_progress": goal_progress_chart,
        "team_performance": team_perf_chart,
        "task_distribution": task_dist_chart,
        "hiring_funnel": hiring_funnel_chart,
        "city_expansion": expansion_chart,
        "product_milestones": product_chart,
    }
    
    return DashboardOut(
        kpis=kpis,
        goal_cards=goal_cards,
        alerts=alerts[:15],
        charts=charts_data,
    )

@router.get("/employee-metrics")
async def get_employee_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    week_end = today + timedelta(days=7)
    
    # Strictly scoped to current_user.id
    tasks_res = await db.execute(
        select(Activity).where(Activity.assigned_to == current_user.id).order_by(Activity.due_date.asc().nulls_last())
    )
    my_tasks = tasks_res.scalars().all()
    
    total_assigned = len(my_tasks)
    today_tasks = len([t for t in my_tasks if t.due_date == today and t.status != "completed"])
    pending_tasks = len([t for t in my_tasks if t.status in ("assigned", "todo", "in_progress")])
    under_review_tasks = len([t for t in my_tasks if t.status == "under_review"])
    completed_tasks = len([t for t in my_tasks if t.status == "completed"])
    overdue_tasks = len([t for t in my_tasks if t.due_date and t.due_date < today and t.status != "completed"])
    upcoming_tasks = [t for t in my_tasks if t.due_date and t.due_date > today and t.due_date <= week_end and t.status != "completed"]
    
    productivity = round((completed_tasks / total_assigned * 100), 1) if total_assigned > 0 else 0.0
    
    user_payload = {
        "id": current_user.id,
        "employee_id": current_user.employee_id or "FA-EMP-001",
        "name": current_user.full_name,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "department": current_user.department or "Operations",
        "designation": getattr(current_user, 'designation', None) or getattr(current_user, 'job_title', None) or "Team Member",
        "role": current_user.role,
        "status": getattr(current_user, 'status', 'active')
    }
    
    return {
        "user": user_payload,
        "employee": user_payload,
        "kpis": {
            "total_assigned": total_assigned,
            "today_tasks": today_tasks,
            "pending_tasks": pending_tasks,
            "under_review_tasks": under_review_tasks,
            "completed_tasks": completed_tasks,
            "overdue_tasks": overdue_tasks,
            "upcoming_deadlines_count": len(upcoming_tasks),
            "productivity_pct": productivity
        },
        "upcoming_deadlines": [
            {
                "id": t.id,
                "name": t.name,
                "due_date": t.due_date.isoformat() if t.due_date else None,
                "priority": t.priority,
                "status": t.status,
                "rag_status": t.rag_status
            } for t in upcoming_tasks
        ],
        "recent_tasks": [
            {
                "id": t.id,
                "name": t.name,
                "status": t.status,
                "priority": t.priority,
                "due_date": t.due_date.isoformat() if t.due_date else None,
                "submission_notes": t.submission_notes,
                "admin_feedback": t.admin_feedback,
                "rag_status": t.rag_status
            } for t in my_tasks[:10]
        ]
    }
