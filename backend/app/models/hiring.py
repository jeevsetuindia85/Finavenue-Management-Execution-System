import uuid
from datetime import datetime, date, timezone
from sqlalchemy import String, Text, Date, DateTime, ForeignKey, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class HiringAgency(Base):
    __tablename__ = "hiring_agencies"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    contact_person: Mapped[str | None] = mapped_column(String(150), nullable=True)
    contact_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    contact_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    position_assigned: Mapped[str] = mapped_column(String(100), nullable=False)  # Senior Analyst / Senior BD / CAT II Fund Manager
    date_appointed: Mapped[date | None] = mapped_column(Date, nullable=True)
    target_cvs: Mapped[int | None] = mapped_column(Integer, nullable=True)
    total_cvs_received: Mapped[int] = mapped_column(Integer, default=0)
    last_cv_received_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    last_followup_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    followup_owner_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    reason_for_no_cv: Mapped[str | None] = mapped_column(Text, nullable=True)
    next_followup_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="active")  # active / inactive / underperforming
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class Candidate(Base):
    __tablename__ = "candidates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    position: Mapped[str] = mapped_column(String(100), nullable=False)
    source_type: Mapped[str] = mapped_column(String(50), nullable=False)  # agency / network / conference / referral / direct
    source_agency_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("hiring_agencies.id"), nullable=True)
    current_stage: Mapped[str] = mapped_column(String(50), default="source")  # source → cv_received → screening → interview_scheduled → interview_completed → selected → offer_released → joined / rejected
    expected_compensation: Mapped[str | None] = mapped_column(String(100), nullable=True)
    offer_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    joining_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    assigned_recruiter_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    remarks: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    interviews = relationship("CandidateInterview", back_populates="candidate", cascade="all, delete-orphan")

class CandidateInterview(Base):
    __tablename__ = "candidate_interviews"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    candidate_id: Mapped[str] = mapped_column(String(36), ForeignKey("candidates.id"), nullable=False)
    interview_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    panel: Mapped[str | None] = mapped_column(Text, nullable=True)
    outcome: Mapped[str | None] = mapped_column(String(100), nullable=True)
    feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    next_round: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    candidate = relationship("Candidate", back_populates="interviews")

class ProfessionalReference(Base):
    __tablename__ = "professional_references"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    contact_person: Mapped[str] = mapped_column(String(200), nullable=False)
    company_background: Mapped[str | None] = mapped_column(String(300), nullable=True)
    reference_source: Mapped[str | None] = mapped_column(String(200), nullable=True)
    potential_candidate_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    role_fit: Mapped[str | None] = mapped_column(String(100), nullable=True)
    date_of_contact: Mapped[date | None] = mapped_column(Date, nullable=True)
    followup_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    outcome: Mapped[str | None] = mapped_column(Text, nullable=True)
    owner_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class Conference(Base):
    __tablename__ = "conferences"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(300), nullable=False)
    event_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    location: Mapped[str | None] = mapped_column(String(200), nullable=True)
    relevance_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    attendance_status: Mapped[str] = mapped_column(String(30), default="planned")  # planned / registered / attended / missed
    people_met: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON
    post_event_followups: Mapped[str | None] = mapped_column(Text, nullable=True)
    owner_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
