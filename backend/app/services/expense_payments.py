from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.expense import Expense, ExpenseStatus
from app.models.expense_installment_payment import ExpenseInstallmentPayment
from app.services.expense_calculator import _get_total_installments


def sync_manual_paid_installments(
    db: Session,
    expense: Expense,
    count: int,
    *,
    adjust_status: bool = True,
) -> None:
    if count < 0:
        raise ValueError("invalid_paid_installments")

    max_installments = _get_total_installments(expense)
    if max_installments is not None and count > max_installments:
        raise ValueError("paid_installments_exceeds_total")

    existing = {payment.installment_number: payment for payment in expense.installment_payments}
    target_numbers = set(range(1, count + 1))
    current_numbers = set(existing.keys())

    for number in current_numbers - target_numbers:
        db.delete(existing[number])

    now = datetime.now(timezone.utc)
    for number in target_numbers - current_numbers:
        db.add(
            ExpenseInstallmentPayment(
                expense_id=expense.id,
                installment_number=number,
                paid_at=now,
            )
        )

    db.flush()

    if adjust_status:
        if max_installments is not None and count >= max_installments:
            expense.status = ExpenseStatus.PAID_OFF
        elif (
            expense.status == ExpenseStatus.PAID_OFF
            and max_installments is not None
            and count < max_installments
        ):
            expense.status = ExpenseStatus.ACTIVE
