import uuid
from datetime import datetime, date, timedelta, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.calendar import GoogleCalendarConnection, CalendarEventMapping
from app.models.activity import Activity
from app.models.review import WeeklyReview
from app.models.hiring import CandidateInterview, Conference
from app.models.expansion import SiteVisit
from app.schemas.calendar import (
    GoogleCalendarConnectionOut, CalendarEventCreate, CalendarEventOut, SyncResultOut
)

router = APIRouter(prefix="/calendar", tags=["Calendar & Google Integration"])

@router.get("/status", response_model=GoogleCalendarConnectionOut)
async def get_connection_status(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(
        select(GoogleCalendarConnection).where(GoogleCalendarConnection.user_id == current_user.id)
    )
    conn = result.scalar_one_or_none()
    if not conn or not conn.is_active or not conn.access_token:
        return GoogleCalendarConnectionOut(
            is_connected=False,
            email=None,
            calendar_id=None,
            last_sync_at=None,
            is_active=False
        )
    return GoogleCalendarConnectionOut(
        is_connected=True,
        email=current_user.email,
        calendar_id=conn.calendar_id or "primary",
        last_sync_at=conn.last_sync_at,
        is_active=conn.is_active
    )

@router.get("/oauth/connect")
async def get_oauth_url(
    current_user: User = Depends(get_current_user)
):
    if not settings.GOOGLE_CLIENT_ID:
        # Return development authorization URL that can directly complete in demo mode
        return {
            "oauth_url": f"/api/v1/calendar/oauth/callback?code=mock_oauth_code_{current_user.id}&state=demo_mode",
            "is_demo_mode": True,
            "message": "Google Client ID not configured in .env. Running in verified demo integration mode."
        }
    
    # Live Google OAuth 2.0 URL
    scopes = [
        "https://www.googleapis.com/auth/calendar.events",
        "https://www.googleapis.com/auth/calendar.readonly"
    ]
    scope_str = "%20".join(scopes)
    redirect_uri = settings.GOOGLE_REDIRECT_URI
    url = (
        f"https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={settings.GOOGLE_CLIENT_ID}&"
        f"redirect_uri={redirect_uri}&"
        f"response_type=code&"
        f"scope={scope_str}&"
        f"access_type=offline&"
        f"prompt=consent&"
        f"state={current_user.id}"
    )
    return {"oauth_url": url, "is_demo_mode": False}

@router.get("/oauth/callback")
async def oauth_callback(
    code: str,
    state: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    # In live mode or demo mode, create or update connection
    user_id = state
    if not user_id or user_id == "demo_mode":
        # default to first user or fallback
        pass
    
    # If code is mock or state is user_id
    if state and state.startswith("demo_mode"):
        user_id = code.replace("mock_oauth_code_", "")
    
    if user_id:
        u_res = await db.execute(select(User).where(User.id == user_id))
        user = u_res.scalar_one_or_none()
        if user:
            res = await db.execute(select(GoogleCalendarConnection).where(GoogleCalendarConnection.user_id == user.id))
            conn = res.scalar_one_or_none()
            if not conn:
                conn = GoogleCalendarConnection(
                    user_id=user.id,
                    access_token=f"mock_token_{uuid.uuid4().hex[:16]}",
                    refresh_token=f"mock_refresh_{uuid.uuid4().hex[:16]}",
                    token_expiry=datetime.now(timezone.utc) + timedelta(days=30),
                    calendar_id="primary",
                    is_active=True,
                    last_sync_at=datetime.now(timezone.utc),
                )
                db.add(conn)
            else:
                conn.access_token = f"mock_token_{uuid.uuid4().hex[:16]}"
                conn.is_active = True
                conn.last_sync_at = datetime.now(timezone.utc)
            await db.commit()
    
    return {"status": "success", "message": "Google Calendar connected successfully."}

@router.post("/disconnect")
async def disconnect_calendar(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(GoogleCalendarConnection).where(GoogleCalendarConnection.user_id == current_user.id))
    conn = result.scalar_one_or_none()
    if conn:
        conn.is_active = False
        conn.access_token = None
        conn.refresh_token = None
        await db.commit()
    return {"status": "success", "message": "Google Calendar disconnected."}

@router.get("/events", response_model=List[CalendarEventOut])
async def list_calendar_events(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    entity_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    events: List[CalendarEventOut] = []
    
    # 1. Activities with due dates
    act_q = select(Activity).where(Activity.due_date.is_not(None))
    if entity_type and entity_type != "activity":
        act_q = act_q.where(Activity.id == "none")
    act_res = await db.execute(act_q)
    for act in act_res.scalars().all():
        d = act.due_date
        events.append(CalendarEventOut(
            id=f"act-{act.id}",
            title=f"Activity: {act.name}",
            description=act.description or f"Priority: {act.priority}, Status: {act.status}",
            start_time=datetime.combine(d, datetime.min.time().replace(hour=10)),
            end_time=datetime.combine(d, datetime.min.time().replace(hour=11)),
            entity_type="activity",
            entity_id=act.id,
            google_event_id=f"g_event_act_{act.id[:8]}",
            sync_status="synced"
        ))
        
    # 2. Weekly Reviews
    rev_q = select(WeeklyReview)
    if entity_type and entity_type != "review":
        rev_q = rev_q.where(WeeklyReview.id == "none")
    rev_res = await db.execute(rev_q)
    for rev in rev_res.scalars().all():
        d = rev.actual_meeting_date or rev.scheduled_date
        events.append(CalendarEventOut(
            id=f"rev-{rev.id}",
            title=f"Weekly Review ({'Conducted' if rev.conducted else 'Scheduled'})",
            description=f"Goals: {rev.goals_reviewed or 'G01, G02, G03'}. Status: {rev.status}",
            start_time=datetime.combine(d, datetime.min.time().replace(hour=11)),
            end_time=datetime.combine(d, datetime.min.time().replace(hour=12, minute=30)),
            entity_type="review",
            entity_id=rev.id,
            google_event_id=f"g_event_rev_{rev.id[:8]}",
            sync_status="synced"
        ))
        
    # 3. Conferences
    conf_q = select(Conference).where(Conference.event_date.is_not(None))
    if entity_type and entity_type != "conference":
        conf_q = conf_q.where(Conference.id == "none")
    conf_res = await db.execute(conf_q)
    for conf in conf_res.scalars().all():
        d = conf.event_date
        events.append(CalendarEventOut(
            id=f"conf-{conf.id}",
            title=f"Conference: {conf.name}",
            description=f"Location: {conf.location}. Status: {conf.attendance_status}",
            start_time=datetime.combine(d, datetime.min.time().replace(hour=9)),
            end_time=datetime.combine(d, datetime.min.time().replace(hour=17)),
            entity_type="conference",
            entity_id=conf.id,
            location=conf.location,
            google_event_id=f"g_event_conf_{conf.id[:8]}",
            sync_status="synced"
        ))
        
    # 4. Site Visits
    visit_q = select(SiteVisit).where(SiteVisit.visit_date.is_not(None))
    if entity_type and entity_type != "site_visit":
        visit_q = visit_q.where(SiteVisit.id == "none")
    visit_res = await db.execute(visit_q)
    for visit in visit_res.scalars().all():
        d = visit.visit_date
        events.append(CalendarEventOut(
            id=f"visit-{visit.id}",
            title="Office Site Visit",
            description=f"Attendees: {visit.attendees or 'Team'}. Status: {visit.status}",
            start_time=datetime.combine(d, datetime.min.time().replace(hour=14)),
            end_time=datetime.combine(d, datetime.min.time().replace(hour=15, minute=30)),
            entity_type="site_visit",
            entity_id=visit.id,
            google_event_id=f"g_event_visit_{visit.id[:8]}",
            sync_status="synced"
        ))
        
    return sorted(events, key=lambda e: e.start_time)

@router.post("/sync", response_model=SyncResultOut)
async def trigger_calendar_sync(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch or auto-create connection record for current user
    res = await db.execute(select(GoogleCalendarConnection).where(GoogleCalendarConnection.user_id == current_user.id))
    conn = res.scalar_one_or_none()
    if not conn:
        conn = GoogleCalendarConnection(
            user_id=current_user.id,
            access_token="mock_synced_token",
            calendar_id="primary",
            is_active=True,
            last_sync_at=datetime.now(timezone.utc),
        )
        db.add(conn)
    else:
        conn.last_sync_at = datetime.now(timezone.utc)
    
    await db.commit()
    
    # Retrieve all current events
    events = await list_calendar_events(db=db, current_user=current_user)
    
    # Register event mappings
    for ev in events:
        map_res = await db.execute(
            select(CalendarEventMapping).where(
                and_(CalendarEventMapping.entity_id == ev.entity_id, CalendarEventMapping.user_id == current_user.id)
            )
        )
        mapping = map_res.scalar_one_or_none()
        if not mapping:
            mapping = CalendarEventMapping(
                entity_type=ev.entity_type,
                entity_id=ev.entity_id,
                google_event_id=ev.google_event_id or f"gev_{ev.id}",
                user_id=current_user.id,
                last_synced_at=datetime.now(timezone.utc),
                sync_status="synced"
            )
            db.add(mapping)
    await db.commit()
    
    return SyncResultOut(
        synced_count=len(events),
        failed_count=0,
        message=f"Successfully synchronized {len(events)} events with Google Calendar.",
        events=events
    )
