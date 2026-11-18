from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel

# Site Visit
class SiteVisitBase(BaseModel):
    visit_date: Optional[date] = None
    attendees: Optional[str] = None
    observations: Optional[str] = None
    next_action: Optional[str] = None
    status: str = "planned"

class SiteVisitCreate(SiteVisitBase):
    coworking_provider_id: str

class SiteVisitUpdate(BaseModel):
    visit_date: Optional[date] = None
    attendees: Optional[str] = None
    observations: Optional[str] = None
    next_action: Optional[str] = None
    status: Optional[str] = None

class SiteVisitOut(SiteVisitBase):
    id: str
    coworking_provider_id: str
    created_at: datetime

    class Config:
        from_attributes = True

# Coworking Provider
class CoworkingProviderBase(BaseModel):
    provider_name: str
    location_address: Optional[str] = None
    contact_person: Optional[str] = None
    contact_details: Optional[str] = None
    monthly_rent: Optional[float] = None
    security_deposit: Optional[float] = None
    facilities: Optional[str] = None
    capacity: Optional[int] = None
    proposal_received_date: Optional[date] = None
    comparison_notes: Optional[str] = None
    is_selected: bool = False
    agreement_status: str = "pending"

class CoworkingProviderCreate(CoworkingProviderBase):
    office_location_id: str

class CoworkingProviderUpdate(BaseModel):
    provider_name: Optional[str] = None
    location_address: Optional[str] = None
    contact_person: Optional[str] = None
    contact_details: Optional[str] = None
    monthly_rent: Optional[float] = None
    security_deposit: Optional[float] = None
    facilities: Optional[str] = None
    capacity: Optional[int] = None
    proposal_received_date: Optional[date] = None
    comparison_notes: Optional[str] = None
    is_selected: Optional[bool] = None
    agreement_status: Optional[str] = None

class CoworkingProviderOut(CoworkingProviderBase):
    id: str
    office_location_id: str
    created_at: datetime
    site_visits: List[SiteVisitOut] = []

    class Config:
        from_attributes = True

# Office Location
class OfficeLocationBase(BaseModel):
    city: str  # Ahmedabad / Bangalore
    target_operational_date: Optional[date] = None
    actual_operational_date: Optional[date] = None
    status: str = "planning"  # planning / site_selection / agreement / operational
    bd_target_headcount: Optional[int] = 3
    bd_current_headcount: int = 0

class OfficeLocationCreate(OfficeLocationBase):
    pass

class OfficeLocationUpdate(BaseModel):
    target_operational_date: Optional[date] = None
    actual_operational_date: Optional[date] = None
    status: Optional[str] = None
    bd_target_headcount: Optional[int] = None
    bd_current_headcount: Optional[int] = None

class OfficeLocationOut(OfficeLocationBase):
    id: str
    created_at: datetime
    updated_at: datetime
    providers: List[CoworkingProviderOut] = []

    class Config:
        from_attributes = True

class ExpansionSummaryOut(BaseModel):
    locations: List[OfficeLocationOut]
    total_shortlisted_providers: int
    total_site_visits_conducted: int
    total_bd_headcount_target: int
    total_bd_headcount_current: int
