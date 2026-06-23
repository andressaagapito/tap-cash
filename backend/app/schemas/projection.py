from decimal import Decimal

from pydantic import BaseModel


class MonthProjection(BaseModel):
    month: str
    year: int
    month_number: int
    expected_salary: Decimal
    recurring_expenses: Decimal
    installment_expenses: Decimal
    total_committed: Decimal
    estimated_balance: Decimal
    ending_accounts: list[str]


class ProjectionResponse(BaseModel):
    months: list[MonthProjection]
    monthly_salary: Decimal
