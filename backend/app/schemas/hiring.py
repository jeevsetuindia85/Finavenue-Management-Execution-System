from datetime import date, datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field

# Agency
class HiringAgencyBase(BaseModel):
    name: str
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    position_assigned: str  # Senior Analyst / Senior BD / CAT II Fund Manager
    date_appointed: Optional[date] = None
    target_cvs: Optional[int] = None
    total_cvs_received: int = 0
    last_cv_received_date: Optional[date] = None
    last_followup_date: Optional[date] = None
    followup_owner_id: Optional[str] = None
    reason_for_no_cv: Optional[str] = None
    next_followup_date: Optional[date] = None
    status: str = "active"
    remarks: Optional[str] = None

class HiringAgencyCreate(HiringAgencyBase):
    pass

class HiringAgencyUpdate(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    position_assigned: Optional[str] = None
    date_appointed: Optional[date] = None
    target_cvs: Optional[int] = None
    total_cvs_received: Optional[int] = None
    last_cv_received_date: Optional[date] = None
    last_followup_date: Optional[date] = None
    followup_owner_id: Optional[str] = None
    reason_for_no_cv: Optional[str] = None
    next_followup_date: Optional[date] = None
    status: Optional[str] = None
    remarks: Optional[str] = None

class HiringAgencyOut(HiringAgencyBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# Candidate Interview
class CandidateInterviewBase(BaseModel):
    interview_date: Optional[date] = None
    panel: Optional[str] = None
    outcome: Optional[str] = None
    feedback: Optional[str] = None
    next_round: Optional[str] = None

class CandidateInterviewCreate(CandidateInterviewBase):
    candidate_id: str

class CandidateInterviewOut(CandidateInterviewBase):
    id: str
    candidate_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# Candidate
class CandidateBase(BaseModel):
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    position: str
    source_type: str = "agency"  # agency, network, conference, referral, direct
    source_agency_id: Optional[str] = None
    current_stage: str = "source"  # source, cv_received, screening, interview_scheduled, interview_completed, selected, offer_released, joined, rejected
    expected_compensation: Optional[str] = None
    offer_status: Optional[str] = None
    joining_date: Optional[date] = None
    assigned_recruiter_id: Optional[str] = None
    remarks: Optional[str] = None

class CandidateCreate(CandidateBase):
    pass

class CandidateUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    source_type: Optional[str] = None
    source_agency_id: Optional[str] = None
    current_stage: Optional[str] = None
    expected_compensation: Optional[str] = None
    offer_status: Optional[str] = None
    joining_date: Optional[date] = None
    assigned_recruiter_id: Optional[str] = None
    remarks: Optional[str] = None

class CandidateOut(CandidateBase):
    id: str
    created_at: datetime
    updated_at: datetime
    interviews: List[CandidateInterviewOut] = []

    class Config:
        from_attributes = True

# Professional Reference
class ProfessionalReferenceBase(BaseModel):
    contact_person: str
    company_background: Optional[str] = None
    reference_source: Optional[str] = None
    potential_candidate_name: Optional[str] = None
    role_fit: Optional[str] = None
    date_of_contact: Optional[date] = None
    followup_date: Optional[date] = None
    outcome: Optional[str] = None
    owner_id: Optional[str] = None

class ProfessionalReferenceCreate(ProfessionalReferenceBase):
    pass

class ProfessionalReferenceUpdate(BaseModel):
    contact_person: Optional[str] = None
    company_background: Optional[str] = None
    reference_source: Optional[str] = None
    potential_candidate_name: Optional[str] = None
    role_fit: Optional[str] = None
    date_of_contact: Optional[date] = None
    followup_date: Optional[date] = None
    outcome: Optional[str] = None
    owner_id: Optional[str] = None

class ProfessionalReferenceOut(ProfessionalReferenceBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

# Conference
class ConferenceBase(BaseModel):
    name: str
    event_date: Optional[date] = None
    location: Optional[str] = None
    relevance_notes: Optional[str] = None
    attendance_status: str = "planned"  # planned, registered, attended, missed
    people_met: Optional[str] = None
    post_event_followups: Optional[str] = None
    owner_id: Optional[str] = None

class ConferenceCreate(ConferenceBase):
    pass

class ConferenceUpdate(BaseModel):
    name: Optional[str] = None
    event_date: Optional[date] = None
    location: Optional[str] = None
    relevance_notes: Optional[str] = None
    attendance_status: Optional[str] = None
    people_met: Optional[str] = None
    post_event_followups: Optional[str] = None
    owner_id: Optional[str] = None

class ConferenceOut(ConferenceBase):
    id: str
    created_at: datetime

    class Config:
        from_attributes = True

# Summary KPI Schema
class HiringSummaryOut(BaseModel):
    total_agencies: int
    active_agencies: int
    underperforming_agencies: int
    total_cvs_received: int
    total_candidates: int
    candidates_by_stage: dict[str, int]
    candidates_by_position: dict[str, int]
    reference_calls_this_week: int
    reference_calls_target: int = 4
    conferences_this_month: int
    conferences_target: int = 2
