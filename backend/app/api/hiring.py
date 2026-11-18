from datetime import date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User
from app.models.hiring import HiringAgency, Candidate, CandidateInterview, ProfessionalReference, Conference
from app.schemas.hiring import (
    HiringAgencyCreate, HiringAgencyUpdate, HiringAgencyOut,
    CandidateCreate, CandidateUpdate, CandidateOut, CandidateInterviewCreate, CandidateInterviewOut,
    ProfessionalReferenceCreate, ProfessionalReferenceUpdate, ProfessionalReferenceOut,
    ConferenceCreate, ConferenceUpdate, ConferenceOut, HiringSummaryOut
)

router = APIRouter(prefix="/hiring", tags=["Hiring Management"])

# --- AGENCIES ---
@router.get("/agencies", response_model=List[HiringAgencyOut])
async def list_agencies(
    position: Optional[str] = None,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(HiringAgency)
    filters = []
    if position:
        filters.append(HiringAgency.position_assigned == position)
    if status:
        filters.append(HiringAgency.status == status)
    if filters:
        query = query.where(and_(*filters))
    query = query.order_by(HiringAgency.name)
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/agencies", response_model=HiringAgencyOut, status_code=status.HTTP_201_CREATED)
async def create_agency(
    agency_in: HiringAgencyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("management", "goal_owner", "admin", "coordinator"))
):
    agency = HiringAgency(**agency_in.model_dump())
    db.add(agency)
    await db.commit()
    await db.refresh(agency)
    return agency

@router.get("/agencies/{agency_id}", response_model=HiringAgencyOut)
async def get_agency(
    agency_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(HiringAgency).where(HiringAgency.id == agency_id))
    agency = result.scalar_one_or_none()
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")
    return agency

@router.patch("/agencies/{agency_id}", response_model=HiringAgencyOut)
async def update_agency(
    agency_id: str,
    agency_in: HiringAgencyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("management", "goal_owner", "admin", "coordinator", "team_member"))
):
    result = await db.execute(select(HiringAgency).where(HiringAgency.id == agency_id))
    agency = result.scalar_one_or_none()
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")
    for field, val in agency_in.model_dump(exclude_unset=True).items():
        setattr(agency, field, val)
    await db.commit()
    await db.refresh(agency)
    return agency

@router.delete("/agencies/{agency_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agency(
    agency_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("management", "admin"))
):
    result = await db.execute(select(HiringAgency).where(HiringAgency.id == agency_id))
    agency = result.scalar_one_or_none()
    if not agency:
        raise HTTPException(status_code=404, detail="Agency not found")
    await db.delete(agency)
    await db.commit()
    return None

# --- CANDIDATES ---
@router.get("/candidates", response_model=List[CandidateOut])
async def list_candidates(
    position: Optional[str] = None,
    stage: Optional[str] = None,
    source_type: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Candidate).options(selectinload(Candidate.interviews))
    filters = []
    if position:
        filters.append(Candidate.position == position)
    if stage:
        filters.append(Candidate.current_stage == stage)
    if source_type:
        filters.append(Candidate.source_type == source_type)
    if filters:
        query = query.where(and_(*filters))
    query = query.order_by(Candidate.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/candidates", response_model=CandidateOut, status_code=status.HTTP_201_CREATED)
async def create_candidate(
    candidate_in: CandidateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    candidate = Candidate(**candidate_in.model_dump())
    db.add(candidate)
    await db.commit()
    await db.refresh(candidate)
    result = await db.execute(select(Candidate).options(selectinload(Candidate.interviews)).where(Candidate.id == candidate.id))
    return result.scalar_one()

@router.get("/candidates/{candidate_id}", response_model=CandidateOut)
async def get_candidate(
    candidate_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Candidate).options(selectinload(Candidate.interviews)).where(Candidate.id == candidate_id))
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate

@router.patch("/candidates/{candidate_id}", response_model=CandidateOut)
async def update_candidate(
    candidate_id: str,
    candidate_in: CandidateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Candidate).options(selectinload(Candidate.interviews)).where(Candidate.id == candidate_id))
    candidate = result.scalar_one_or_none()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    for field, val in candidate_in.model_dump(exclude_unset=True).items():
        setattr(candidate, field, val)
    await db.commit()
    await db.refresh(candidate)
    return candidate

@router.post("/candidates/{candidate_id}/interviews", response_model=CandidateInterviewOut, status_code=status.HTTP_201_CREATED)
async def add_candidate_interview(
    candidate_id: str,
    interview_in: CandidateInterviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    c_res = await db.execute(select(Candidate).where(Candidate.id == candidate_id))
    if not c_res.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Candidate not found")
    interview = CandidateInterview(candidate_id=candidate_id, **interview_in.model_dump())
    db.add(interview)
    await db.commit()
    await db.refresh(interview)
    return interview

# --- REFERENCES (Target: 4 calls per week) ---
@router.get("/references", response_model=List[ProfessionalReferenceOut])
async def list_references(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(ProfessionalReference).order_by(ProfessionalReference.created_at.desc()))
    return result.scalars().all()

@router.post("/references", response_model=ProfessionalReferenceOut, status_code=status.HTTP_201_CREATED)
async def create_reference(
    ref_in: ProfessionalReferenceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    ref = ProfessionalReference(**ref_in.model_dump())
    if not ref.owner_id:
        ref.owner_id = current_user.id
    db.add(ref)
    await db.commit()
    await db.refresh(ref)
    return ref

@router.patch("/references/{ref_id}", response_model=ProfessionalReferenceOut)
async def update_reference(
    ref_id: str,
    ref_in: ProfessionalReferenceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(ProfessionalReference).where(ProfessionalReference.id == ref_id))
    ref = result.scalar_one_or_none()
    if not ref:
        raise HTTPException(status_code=404, detail="Reference not found")
    for field, val in ref_in.model_dump(exclude_unset=True).items():
        setattr(ref, field, val)
    await db.commit()
    await db.refresh(ref)
    return ref

# --- CONFERENCES (Target: 1 every 15 days) ---
@router.get("/conferences", response_model=List[ConferenceOut])
async def list_conferences(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Conference).order_by(Conference.event_date.desc().nulls_last()))
    return result.scalars().all()

@router.post("/conferences", response_model=ConferenceOut, status_code=status.HTTP_201_CREATED)
async def create_conference(
    conf_in: ConferenceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conf = Conference(**conf_in.model_dump())
    if not conf.owner_id:
        conf.owner_id = current_user.id
    db.add(conf)
    await db.commit()
    await db.refresh(conf)
    return conf

@router.patch("/conferences/{conf_id}", response_model=ConferenceOut)
async def update_conference(
    conf_id: str,
    conf_in: ConferenceUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(Conference).where(Conference.id == conf_id))
    conf = result.scalar_one_or_none()
    if not conf:
        raise HTTPException(status_code=404, detail="Conference not found")
    for field, val in conf_in.model_dump(exclude_unset=True).items():
        setattr(conf, field, val)
    await db.commit()
    await db.refresh(conf)
    return conf

# --- SUMMARY METRICS ---
@router.get("/summary", response_model=HiringSummaryOut)
async def get_hiring_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    month_start = today.replace(day=1)
    
    agencies_res = await db.execute(select(HiringAgency))
    agencies = agencies_res.scalars().all()
    total_agencies = len(agencies)
    active_agencies = len([a for a in agencies if a.status == "active"])
    underperforming = len([a for a in agencies if a.status == "underperforming"])
    total_cvs = sum(a.total_cvs_received for a in agencies)
    
    candidates_res = await db.execute(select(Candidate))
    candidates = candidates_res.scalars().all()
    total_candidates = len(candidates)
    
    stages = ["source", "cv_received", "screening", "interview_scheduled", "interview_completed", "selected", "offer_released", "joined", "rejected"]
    stage_counts = {s: 0 for s in stages}
    pos_counts = {"Senior Analyst": 0, "Senior BD": 0, "CAT II Fund Manager": 0}
    
    for c in candidates:
        if c.current_stage in stage_counts:
            stage_counts[c.current_stage] += 1
        pos = c.position
        pos_counts[pos] = pos_counts.get(pos, 0) + 1
        
    ref_q = await db.execute(
        select(func.count(ProfessionalReference.id)).where(ProfessionalReference.date_of_contact >= week_start)
    )
    ref_count = ref_q.scalar() or 0
    
    conf_q = await db.execute(
        select(func.count(Conference.id)).where(Conference.event_date >= month_start)
    )
    conf_count = conf_q.scalar() or 0
    
    return HiringSummaryOut(
        total_agencies=total_agencies,
        active_agencies=active_agencies,
        underperforming_agencies=underperforming,
        total_cvs_received=total_cvs,
        total_candidates=total_candidates,
        candidates_by_stage=stage_counts,
        candidates_by_position=pos_counts,
        reference_calls_this_week=ref_count,
        reference_calls_target=4,
        conferences_this_month=conf_count,
        conferences_target=2,
    )
