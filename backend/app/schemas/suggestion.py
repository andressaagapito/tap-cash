from decimal import Decimal

from pydantic import BaseModel


class PayoffSuggestion(BaseModel):
    expense_id: int
    name: str
    payment_method: str
    remaining_amount: Decimal
    pending_installments: int
    monthly_impact: Decimal
    reason: str
    strategy: str
