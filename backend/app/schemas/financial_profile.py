from uuid import UUID
from datetime import datetime
from decimal import Decimal
from pydantic import BaseModel, Field


class FinancialProfileUpdate(BaseModel):
    monthly_salary: Decimal | None = Field(default=None, ge=0)
    auto_mark_installments_paid: bool | None = None


class FinancialProfileResponse(BaseModel):
    id: int
    uuid: UUID
    user_id: int
    monthly_salary: Decimal
    auto_mark_installments_paid: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
