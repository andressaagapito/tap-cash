from uuid import UUID
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.goal import GoalCategory, GoalOptionStatus, GoalPriority, GoalStatus


class GoalOptionCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    estimated_amount: Decimal = Field(gt=0)
    description: str | None = None
    reference_link: str | None = Field(default=None, max_length=500)
    status: GoalOptionStatus = GoalOptionStatus.ANALYZING


class GoalOptionUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    estimated_amount: Decimal | None = Field(default=None, gt=0)
    description: str | None = None
    reference_link: str | None = Field(default=None, max_length=500)
    status: GoalOptionStatus | None = None


class GoalOptionResponse(BaseModel):
    id: int
    uuid: UUID
    goal_id: int
    name: str
    estimated_amount: Decimal
    description: str | None
    reference_link: str | None
    status: GoalOptionStatus
    created_at: datetime
    gap_from_saved: Decimal | None = None
    gap_from_target: Decimal | None = None
    monthly_savings_for_option: Decimal | None = None
    affordable_now: bool | None = None
    fits_target: bool | None = None

    model_config = {"from_attributes": True}


class GoalCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    description: str | None = None
    target_amount: Decimal = Field(gt=0)
    saved_amount: Decimal = Field(default=Decimal("0"), ge=0)
    deadline: date | None = None
    priority: GoalPriority = GoalPriority.MEDIUM
    category: GoalCategory = GoalCategory.OTHER
    status: GoalStatus = GoalStatus.ACTIVE


class GoalUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = None
    target_amount: Decimal | None = Field(default=None, gt=0)
    saved_amount: Decimal | None = Field(default=None, ge=0)
    deadline: date | None = None
    priority: GoalPriority | None = None
    category: GoalCategory | None = None
    status: GoalStatus | None = None


class GoalResponse(BaseModel):
    id: int
    uuid: UUID
    user_id: int
    name: str
    description: str | None
    target_amount: Decimal
    saved_amount: Decimal
    deadline: date | None
    priority: GoalPriority
    category: GoalCategory
    status: GoalStatus
    created_at: datetime
    updated_at: datetime
    progress_percent: Decimal = Decimal("0")
    remaining_amount: Decimal = Decimal("0")
    monthly_savings_needed: Decimal | None = None
    estimated_completion_date: date | None = None
    months_until_deadline: int | None = None
    options_count: int = 0

    model_config = {"from_attributes": True}


class GoalOptionComparison(BaseModel):
    option_id: int
    option_uuid: UUID
    name: str
    estimated_amount: Decimal
    status: GoalOptionStatus
    gap_from_saved: Decimal
    gap_from_target: Decimal
    monthly_savings_for_option: Decimal | None = None
    affordable_now: bool
    fits_target: bool


class GoalAnalysis(BaseModel):
    progress_percent: Decimal
    remaining_amount: Decimal
    monthly_savings_needed: Decimal | None = None
    estimated_completion_date: date | None = None
    months_until_deadline: int | None = None
    on_track: bool | None = None
    savings_suggestion: str | None = None


class GoalDetailResponse(GoalResponse):
    options: list[GoalOptionResponse] = []
    option_comparison: list[GoalOptionComparison] = []
    analysis: GoalAnalysis
