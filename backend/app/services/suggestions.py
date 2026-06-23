from decimal import Decimal

from sqlalchemy.orm import Session, joinedload

from app.models.expense import Expense, ExpenseStatus
from app.models.financial_profile import UserFinancialProfile
from app.schemas.suggestion import PayoffSuggestion
from app.services.expense_calculator import get_installment_counts, get_remaining_amount, is_open_debt


def _get_auto_mark(db: Session, user_id: int) -> bool:
    profile = (
        db.query(UserFinancialProfile)
        .filter(UserFinancialProfile.user_id == user_id)
        .first()
    )
    return bool(profile and profile.auto_mark_installments_paid)


def _pick_strategy(
    expense: Expense,
    active: list[Expense],
    auto_mark: bool,
) -> str:
    remaining = get_remaining_amount(expense, auto_mark=auto_mark)
    _, pending = get_installment_counts(expense, auto_mark=auto_mark)

    smallest_remaining = min(get_remaining_amount(e, auto_mark=auto_mark) for e in active)
    highest_installment = max(e.installment_amount for e in active)
    fewest_pending = min(get_installment_counts(e, auto_mark=auto_mark)[1] for e in active)

    if remaining == smallest_remaining:
        return "lowest_amount"
    if expense.installment_amount == highest_installment:
        return "highest_installment"
    if pending == fewest_pending and pending <= 3:
        return "almost_done"
    return "active_debt"


def build_payoff_suggestions(db: Session, user_id: int) -> list[PayoffSuggestion]:
    auto_mark = _get_auto_mark(db, user_id)
    expenses = (
        db.query(Expense)
        .options(joinedload(Expense.installment_payments), joinedload(Expense.card))
        .filter(Expense.user_id == user_id, Expense.status == ExpenseStatus.ACTIVE)
        .all()
    )

    active = [e for e in expenses if is_open_debt(e, auto_mark=auto_mark)]
    if not active:
        return []

    suggestions: list[PayoffSuggestion] = []
    for expense in active:
        paid, pending = get_installment_counts(expense, auto_mark=auto_mark)
        remaining = get_remaining_amount(expense, auto_mark=auto_mark)
        strategy = _pick_strategy(expense, active, auto_mark)
        suggestions.append(
            PayoffSuggestion(
                expense_id=expense.id,
                name=expense.name,
                payment_method=expense.payment_method.value,
                remaining_amount=remaining,
                pending_installments=pending,
                monthly_impact=expense.installment_amount,
                reason=strategy,
                strategy=strategy,
            )
        )

    return sorted(suggestions, key=lambda item: item.remaining_amount)
