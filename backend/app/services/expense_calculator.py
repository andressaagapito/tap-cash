import calendar
from datetime import date
from decimal import Decimal

from dateutil.relativedelta import relativedelta

from app.models.expense import Expense, ExpenseStatus, ExpenseType


def months_between(start: date, end: date) -> int:
    if end < start:
        return 0
    delta = relativedelta(end.replace(day=1), start.replace(day=1))
    return delta.years * 12 + delta.months + 1


def _get_due_day(expense: Expense) -> int:
    if expense.card and expense.card.due_day:
        return expense.card.due_day
    return expense.purchase_date.day


def get_installment_due_date(expense: Expense, installment_number: int) -> date:
    """Due date for installment N (1-based), based on card payment day."""
    reference_month = expense.purchase_date + relativedelta(months=installment_number - 1)
    due_day = _get_due_day(expense)
    last_day = calendar.monthrange(reference_month.year, reference_month.month)[1]
    return date(reference_month.year, reference_month.month, min(due_day, last_day))


def _get_total_installments(expense: Expense) -> int | None:
    if expense.type == ExpenseType.ONE_TIME:
        return expense.total_installments
    if expense.recurrence_months:
        return expense.recurrence_months
    return None


def get_consecutive_manual_paid_count(expense: Expense) -> int:
    manual = {payment.installment_number for payment in expense.installment_payments}
    count = 0
    while (count + 1) in manual:
        count += 1
    return count


def get_max_installments(
    expense_type: ExpenseType,
    total_installments: int,
    recurrence_months: int | None,
) -> int | None:
    if expense_type == ExpenseType.ONE_TIME:
        return total_installments
    if recurrence_months:
        return recurrence_months
    return None


def _get_manual_paid_numbers(expense: Expense) -> set[int]:
    return {payment.installment_number for payment in expense.installment_payments}


def is_installment_paid(
    expense: Expense,
    installment_number: int,
    reference_date: date,
    auto_mark: bool,
) -> bool:
    if expense.status in (ExpenseStatus.PAID_OFF, ExpenseStatus.CANCELLED):
        return expense.status == ExpenseStatus.PAID_OFF

    if installment_number in _get_manual_paid_numbers(expense):
        return True

    due_date = get_installment_due_date(expense, installment_number)
    if auto_mark and reference_date > due_date:
        return True

    return False


def get_installment_counts(
    expense: Expense,
    reference_date: date | None = None,
    auto_mark: bool = False,
) -> tuple[int, int]:
    today = reference_date or date.today()

    if expense.status == ExpenseStatus.PAID_OFF:
        total = _get_total_installments(expense) or expense.total_installments
        return total, 0

    if expense.status == ExpenseStatus.CANCELLED:
        return 0, 0

    total = _get_total_installments(expense)
    if total is None:
        # Recorrente indefinida: conta meses desde início
        elapsed = months_between(expense.purchase_date, today) if today >= expense.purchase_date else 0
        paid = sum(
            1 for n in range(1, elapsed + 1)
            if is_installment_paid(expense, n, today, auto_mark)
        )
        pending = max(elapsed - paid, 0) + 1  # +1 mês corrente como pendente mínimo
        return paid, pending

    paid = sum(
        1 for n in range(1, total + 1)
        if is_installment_paid(expense, n, today, auto_mark)
    )
    pending = max(total - paid, 0)
    return paid, pending


def get_expected_end_date(expense: Expense) -> date | None:
    if expense.status == ExpenseStatus.PAID_OFF:
        return expense.purchase_date

    if expense.type == ExpenseType.ONE_TIME:
        if expense.total_installments <= 1:
            return get_installment_due_date(expense, 1)
        return get_installment_due_date(expense, expense.total_installments)

    if expense.type == ExpenseType.RECURRING:
        if expense.recurrence_months:
            return get_installment_due_date(expense, expense.recurrence_months)
        return None

    return None


def get_remaining_amount(expense: Expense, auto_mark: bool = False) -> Decimal:
    paid, pending = get_installment_counts(expense, auto_mark=auto_mark)
    if expense.status == ExpenseStatus.PAID_OFF:
        return Decimal("0")
    if expense.status == ExpenseStatus.CANCELLED:
        return Decimal("0")
    return expense.installment_amount * pending


def build_installment_details(
    expense: Expense,
    reference_date: date | None = None,
    auto_mark: bool = False,
) -> list[dict]:
    today = reference_date or date.today()
    if expense.status == ExpenseStatus.CANCELLED:
        return []

    total = _get_total_installments(expense)
    if total is None:
        elapsed = months_between(expense.purchase_date, today) if today >= expense.purchase_date else 0
        numbers = list(range(1, elapsed + 2))  # inclui parcela corrente
    else:
        numbers = list(range(1, total + 1))

    manual = _get_manual_paid_numbers(expense)
    details = []
    for number in numbers:
        due = get_installment_due_date(expense, number)
        paid = is_installment_paid(expense, number, today, auto_mark)
        if paid and number in manual:
            paid_by = "manual"
        elif paid and auto_mark and today > due:
            paid_by = "auto"
        elif paid:
            paid_by = "manual"
        else:
            paid_by = None

        details.append(
            {
                "number": number,
                "due_date": due,
                "amount": expense.installment_amount,
                "status": "paid" if paid else "pending",
                "paid_by": paid_by,
            }
        )
    return details


def get_next_pending_installment(
    expense: Expense,
    reference_date: date | None = None,
    auto_mark: bool = False,
) -> dict | None:
    for item in build_installment_details(expense, reference_date, auto_mark):
        if item["status"] == "pending":
            return item
    return None


def is_open_debt(expense: Expense, auto_mark: bool = False) -> bool:
    if expense.status != ExpenseStatus.ACTIVE:
        return False
    _, pending = get_installment_counts(expense, auto_mark=auto_mark)
    return pending > 0


def expense_applies_in_month(expense: Expense, target_year: int, target_month: int) -> bool:
    if expense.status == ExpenseStatus.CANCELLED:
        return False
    if expense.status == ExpenseStatus.PAID_OFF:
        return False

    target = date(target_year, target_month, 1)
    start = expense.purchase_date.replace(day=1)

    if target < start:
        return False

    installment_number = months_between(expense.purchase_date, date(target_year, target_month, 1))

    if expense.type == ExpenseType.ONE_TIME:
        if installment_number > expense.total_installments:
            return False
        return True

    if expense.type == ExpenseType.RECURRING:
        if expense.recurrence_months and installment_number > expense.recurrence_months:
            return False
        return True

    return False


def get_monthly_amount_for_expense(expense: Expense, year: int, month: int) -> Decimal:
    if not expense_applies_in_month(expense, year, month):
        return Decimal("0")
    return expense.installment_amount


def expense_ends_in_month(expense: Expense, year: int, month: int) -> bool:
    end = get_expected_end_date(expense)
    if not end:
        return False
    return end.year == year and end.month == month
