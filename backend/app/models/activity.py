import uuid
from datetime import datetime, date, timezone
from sqlalchemy import String, Text, Date, DateTime, ForeignKey, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
import enum

class ActivityStatus(str, enum.Enum):
    ASSIGNED = "assigned"
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    UNDER_REVIEW = "under_review"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"
    BLOCKED = "blocked"
    CANCELLED = "cancelled"

class RAGStatus(str, enum.Enum):
    GREEN = "green"
    AMBER = "amber"
    RED = "red"
    GREY = "grey"

class Activity(Base):
    __tablename__ = "activities"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    activity_code: Mapped[str | None] = mapped_column(String(30), nullable=True)
    goal_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("goals.id"), nullable=True)
    name: Mapped[str] = mapped_column(String(400), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    assigned_to: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    created_by: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    priority: Mapped[str] = mapped_column(String(20), default="medium")
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    target_frequency: Mapped[str | None] = mapped_column(String(30), nullable=True)  # daily/weekly/...
    target_quantity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    actual_quantity: Mapped[int] = mapped_column(Integer, default=0)
    last_completed_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    next_due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(30), default=ActivityStatus.ASSIGNED.value)
    rag_status: Mapped[str] = mapped_column(String(20), default=RAGStatus.GREY.value)
    evidence_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    module: Mapped[str | None] = mapped_column(String(50), nullable=True)  # hiring / expansion / product / general
    
    # Task Submission & Admin Review workflow fields
    admin_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)
    submission_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    approved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    approved_by: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    goal = relationship("Goal", back_populates="activities")
    assignee = relationship("User", back_populates="assigned_activities", foreign_keys=[assigned_to])
    creator = relationship("User", back_populates="created_activities", foreign_keys=[created_by])
    updates = relationship("ActivityUpdate", back_populates="activity", cascade="all, delete-orphan")
    attachments = relationship("TaskAttachment", back_populates="task", cascade="all, delete-orphan")

class TaskAttachment(Base):
    __tablename__ = "task_attachments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id: Mapped[str] = mapped_column(String(36), ForeignKey("activities.id", ondelete="CASCADE"), nullable=False)
    uploaded_by: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    file_name: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    task = relationship("Activity", back_populates="attachments")
    uploader = relationship("User", foreign_keys=[uploaded_by])

Attachment = TaskAttachment  # Backwards compatibility alias

class ActivityUpdate(Base):
    __tablename__ = "activity_updates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    activity_id: Mapped[str] = mapped_column(String(36), ForeignKey("activities.id"), nullable=False)
    updated_by: Mapped[str | None] = mapped_column(String(36), ForeignKey("users.id"), nullable=True)
    previous_status: Mapped[str | None] = mapped_column(String(30), nullable=True)
    new_status: Mapped[str | None] = mapped_column(String(30), nullable=True)
    previous_quantity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    new_quantity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    activity = relationship("Activity", back_populates="updates")

class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)  # activity, goal, review, candidate
    entity_id: Mapped[str] = mapped_column(String(36), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id"), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
