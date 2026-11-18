from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user, require_roles
from app.models.user import User
from app.models.expansion import OfficeLocation, CoworkingProvider, SiteVisit
from app.schemas.expansion import (
    OfficeLocationCreate, OfficeLocationUpdate, OfficeLocationOut,
    CoworkingProviderCreate, CoworkingProviderUpdate, CoworkingProviderOut,
    SiteVisitCreate, SiteVisitUpdate, SiteVisitOut, ExpansionSummaryOut
)

router = APIRouter(prefix="/expansion", tags=["Office Expansion"])

# --- OFFICE LOCATIONS (Ahmedabad & Bangalore) ---
@router.get("/locations", response_model=List[OfficeLocationOut])
async def list_locations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = (
        select(OfficeLocation)
        .options(
            selectinload(OfficeLocation.providers).selectinload(CoworkingProvider.site_visits)
        )
        .order_by(OfficeLocation.city)
    )
    result = await db.execute(query)
    return result.scalars().all()

@router.get("/locations/{city_or_id}", response_model=OfficeLocationOut)
async def get_location(
    city_or_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = (
        select(OfficeLocation)
        .options(
            selectinload(OfficeLocation.providers).selectinload(CoworkingProvider.site_visits)
        )
        .where(
            (OfficeLocation.id == city_or_id) | (OfficeLocation.city.ilike(city_or_id))
        )
    )
    result = await db.execute(query)
    loc = result.scalar_one_or_none()
    if not loc:
        raise HTTPException(status_code=404, detail="Office location not found")
    return loc

@router.patch("/locations/{loc_id}", response_model=OfficeLocationOut)
async def update_location(
    loc_id: str,
    loc_in: OfficeLocationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("management", "goal_owner", "admin", "coordinator"))
):
    result = await db.execute(select(OfficeLocation).where(OfficeLocation.id == loc_id))
    loc = result.scalar_one_or_none()
    if not loc:
        raise HTTPException(status_code=404, detail="Office location not found")
    for field, val in loc_in.model_dump(exclude_unset=True).items():
        setattr(loc, field, val)
    await db.commit()
    await db.refresh(loc)
    query = (
        select(OfficeLocation)
        .options(
            selectinload(OfficeLocation.providers).selectinload(CoworkingProvider.site_visits)
        )
        .where(OfficeLocation.id == loc.id)
    )
    refreshed = await db.execute(query)
    return refreshed.scalar_one()

# --- COWORKING PROVIDERS ---
@router.get("/providers", response_model=List[CoworkingProviderOut])
async def list_providers(
    city: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(CoworkingProvider).options(selectinload(CoworkingProvider.site_visits))
    if city:
        query = query.join(CoworkingProvider.office_location).where(OfficeLocation.city.ilike(city))
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/providers", response_model=CoworkingProviderOut, status_code=status.HTTP_201_CREATED)
async def create_provider(
    prov_in: CoworkingProviderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("management", "goal_owner", "admin", "coordinator"))
):
    provider = CoworkingProvider(**prov_in.model_dump())
    db.add(provider)
    await db.commit()
    await db.refresh(provider)
    query = select(CoworkingProvider).options(selectinload(CoworkingProvider.site_visits)).where(CoworkingProvider.id == provider.id)
    res = await db.execute(query)
    return res.scalar_one()

@router.patch("/providers/{prov_id}", response_model=CoworkingProviderOut)
async def update_provider(
    prov_id: str,
    prov_in: CoworkingProviderUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(CoworkingProvider).where(CoworkingProvider.id == prov_id))
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    for field, val in prov_in.model_dump(exclude_unset=True).items():
        setattr(provider, field, val)
    await db.commit()
    await db.refresh(provider)
    query = select(CoworkingProvider).options(selectinload(CoworkingProvider.site_visits)).where(CoworkingProvider.id == provider.id)
    res = await db.execute(query)
    return res.scalar_one()

@router.delete("/providers/{prov_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_provider(
    prov_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("management", "admin"))
):
    result = await db.execute(select(CoworkingProvider).where(CoworkingProvider.id == prov_id))
    provider = result.scalar_one_or_none()
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    await db.delete(provider)
    await db.commit()
    return None

# --- SITE VISITS ---
@router.get("/site-visits", response_model=List[SiteVisitOut])
async def list_site_visits(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(SiteVisit).order_by(SiteVisit.visit_date.desc().nulls_last()))
    return result.scalars().all()

@router.post("/site-visits", response_model=SiteVisitOut, status_code=status.HTTP_201_CREATED)
async def create_site_visit(
    visit_in: SiteVisitCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    visit = SiteVisit(**visit_in.model_dump())
    db.add(visit)
    await db.commit()
    await db.refresh(visit)
    return visit

@router.patch("/site-visits/{visit_id}", response_model=SiteVisitOut)
async def update_site_visit(
    visit_id: str,
    visit_in: SiteVisitUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(SiteVisit).where(SiteVisit.id == visit_id))
    visit = result.scalar_one_or_none()
    if not visit:
        raise HTTPException(status_code=404, detail="Site visit not found")
    for field, val in visit_in.model_dump(exclude_unset=True).items():
        setattr(visit, field, val)
    await db.commit()
    await db.refresh(visit)
    return visit

# --- SUMMARY ---
@router.get("/summary", response_model=ExpansionSummaryOut)
async def get_expansion_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = (
        select(OfficeLocation)
        .options(
            selectinload(OfficeLocation.providers).selectinload(CoworkingProvider.site_visits)
        )
        .order_by(OfficeLocation.city)
    )
    result = await db.execute(query)
    locations = result.scalars().all()
    
    total_providers = sum(len(loc.providers) for loc in locations)
    total_visits = sum(sum(len(p.site_visits) for p in loc.providers) for loc in locations)
    target_bd = sum(loc.bd_target_headcount or 0 for loc in locations)
    current_bd = sum(loc.bd_current_headcount or 0 for loc in locations)
    
    return ExpansionSummaryOut(
        locations=locations,
        total_shortlisted_providers=total_providers,
        total_site_visits_conducted=total_visits,
        total_bd_headcount_target=target_bd,
        total_bd_headcount_current=current_bd,
    )
