from uuid import UUID, uuid4
import enum
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class GoalPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class GoalCategory(str, enum.Enum):
    CAR = "car"
    TRAVEL = "travel"
    RESERVE = "reserve"
    DEBT = "debt"
    HOUSE = "house"
    EDUCATION = "education"
    HEALTH = "health"
    OTHER = "other"


class GoalStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class GoalOptionStatus(str, enum.Enum):
    ANALYZING = "analyzing"
    CHOSEN = "chosen"
    DISCARDED = "discarded"


class Goal(Base):
    __tablename__ = "goals"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    uuid: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        unique=True,
        index=True,
        nullable=False,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    saved_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=Decimal("0"))
    deadline: Mapped[date | None] = mapped_column(Date, nullable=True)
    priority: Mapped[GoalPriority] = mapped_column(
        Enum(GoalPriority, values_callable=lambda e: [item.value for item in e]),
        nullable=False,
        default=GoalPriority.MEDIUM,
    )
    category: Mapped[GoalCategory] = mapped_column(
        Enum(GoalCategory, values_callable=lambda e: [item.value for item in e]),
        nullable=False,
        default=GoalCategory.OTHER,
    )
    status: Mapped[GoalStatus] = mapped_column(
        Enum(GoalStatus, values_callable=lambda e: [item.value for item in e]),
        nullable=False,
        default=GoalStatus.ACTIVE,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", back_populates="goals")
    options = relationship("GoalOption", back_populates="goal", cascade="all, delete-orphan")


class GoalOption(Base):
    __tablename__ = "goal_options"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    uuid: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        unique=True,
        index=True,
        nullable=False,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )
    goal_id: Mapped[int] = mapped_column(ForeignKey("goals.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    estimated_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    reference_link: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[GoalOptionStatus] = mapped_column(
        Enum(GoalOptionStatus, values_callable=lambda e: [item.value for item in e]),
        nullable=False,
        default=GoalOptionStatus.ANALYZING,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    goal = relationship("Goal", back_populates="options")
