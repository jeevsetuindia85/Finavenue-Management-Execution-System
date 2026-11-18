import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Boolean, DateTime, Enum as SAEnum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base
import enum

class UserRole(str, enum.Enum):
    MANAGEMENT = "management"
    GOAL_OWNER = "goal_owner"
    TEAM_MEMBER = "team_member"
    COORDINATOR = "coordinator"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(200), nullable=False)
    role: Mapped[str] = mapped_column(String(50), default=UserRole.TEAM_MEMBER.value, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    job_title: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    owned_goals = relationship("Goal", back_populates="owner", foreign_keys="Goal.owner_id")
    assigned_activities = relationship("Activity", back_populates="assignee", foreign_keys="Activity.assigned_to")
    created_activities = relationship("Activity", back_populates="creator", foreign_keys="Activity.created_by")
    notifications = relationship("Notification", back_populates="user")
    google_connection = relationship("GoogleCalendarConnection", back_populates="user", uselist=False)

    def __repr__(self):
        return f"<User {self.email} ({self.role})>"
