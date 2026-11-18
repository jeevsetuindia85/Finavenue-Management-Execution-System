import uuid
from datetime import datetime, date, timezone
from sqlalchemy import String, Text, Date, DateTime, ForeignKey, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

class WeeklyReview(Base):
    __tablename__ = "weekly_reviews"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    week_start_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    scheduled_date: Mapped[date | None] = mapped_column(Date, nullable=True)  # usually Saturday
    actual_meeting_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(40), default="scheduled")  # scheduled / completed / missed_saturday / missed_fallback / red_alert
    conducted: Mapped[bool] = mapped_column(Boolean, default=False)
    goals_reviewed: Mapped[str | None] = mapped_column(Text, nullable=True)  # JSON string of goal ids/names
    major_challenges: Mapped[str | None] = mapped_column(Text, nullable=True)
    decisions: Mapped[str | None] = mapped_column(Text, nullable=True)
    meeting_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    next_review_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_by: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    participants = relationship("MeetingParticipant", back_populates="review", cascade="all, delete-orphan")
    action_items = relationship("ActionItem", back_populates="review", cascade="all, delete-orphan")

class MeetingParticipant(Base):
    __tablename__ = "meeting_participants"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    weekly_review_id: Mapped[str] = mapped_column(String(36), ForeignKey("weekly_reviews.id"), nullable=False)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    attended: Mapped[bool] = mapped_column(Boolean, default=False)

    review = relationship("WeeklyReview", back_populates="participants")

class ActionItem(Base):
    __tablename__ = "action_items"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    weekly_review_id: Mapped[str] = mapped_column(String(36), ForeignKey("weekly_reviews.id"), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    responsible_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default="open")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    review = relationship("WeeklyReview", back_populates="action_items")
