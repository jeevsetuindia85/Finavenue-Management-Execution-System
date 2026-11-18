import uuid
from datetime import datetime, date, timezone
from sqlalchemy import String, Text, Date, DateTime, ForeignKey, Integer, Float, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class OfficeLocation(Base):
    __tablename__ = "office_locations"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    city: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)  # Ahmedabad / Bangalore
    target_operational_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    actual_operational_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(40), default="planning")  # planning / site_selection / agreement / operational
    bd_target_headcount: Mapped[int | None] = mapped_column(Integer, nullable=True)
    bd_current_headcount: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    providers = relationship("CoworkingProvider", back_populates="office_location", cascade="all, delete-orphan")

class CoworkingProvider(Base):
    __tablename__ = "coworking_providers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    office_location_id: Mapped[str] = mapped_column(String(36), ForeignKey("office_locations.id"), nullable=False)
    provider_name: Mapped[str] = mapped_column(String(200), nullable=False)
    location_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    contact_person: Mapped[str | None] = mapped_column(String(150), nullable=True)
    contact_details: Mapped[str | None] = mapped_column(String(255), nullable=True)
    monthly_rent: Mapped[float | None] = mapped_column(Float, nullable=True)
    security_deposit: Mapped[float | None] = mapped_column(Float, nullable=True)
    facilities: Mapped[str | None] = mapped_column(Text, nullable=True)
    capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    proposal_received_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    comparison_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_selected: Mapped[bool] = mapped_column(Boolean, default=False)
    agreement_status: Mapped[str] = mapped_column(String(40), default="pending")  # pending / negotiated / signed / rejected
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    office_location = relationship("OfficeLocation", back_populates="providers")
    site_visits = relationship("SiteVisit", back_populates="provider", cascade="all, delete-orphan")

class SiteVisit(Base):
    __tablename__ = "site_visits"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    coworking_provider_id: Mapped[str] = mapped_column(String(36), ForeignKey("coworking_providers.id"), nullable=False)
    visit_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    attendees: Mapped[str | None] = mapped_column(Text, nullable=True)
    observations: Mapped[str | None] = mapped_column(Text, nullable=True)
    next_action: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="planned")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    provider = relationship("CoworkingProvider", back_populates="site_visits")
