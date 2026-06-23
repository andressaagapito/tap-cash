from datetime import date
from decimal import Decimal

from dateutil.relativedelta import relativedelta
from sqlalchemy.orm import Session

from app.models.expense import Expense, ExpenseStatus, ExpenseType
from app.models.financial_profile import UserFinancialProfile
from app.schemas.projection import MonthProjection, ProjectionResponse
from app.services.expense_calculator import expense_ends_in_month, get_monthly_amount_for_expense


def build_projection(db: Session, user_id: int, months: int = 12) -> ProjectionResponse:
    profile = db.query(UserFinancialProfile).filter(UserFinancialProfile.user_id == user_id).first()
    salary = profile.monthly_salary if profile else Decimal("0")

    expenses = (
        db.query(Expense)
        .filter(Expense.user_id == user_id, Expense.status == ExpenseStatus.ACTIVE)
        .all()
    )

    today = date.today()
    projections: list[MonthProjection] = []

    for i in range(months):
        target = today + relativedelta(months=i)
        year, month = target.year, target.month

        recurring = Decimal("0")
        installment = Decimal("0")
        ending: list[str] = []

        for expense in expenses:
            amount = get_monthly_amount_for_expense(expense, year, month)
            if amount <= 0:
                continue
            if expense.type == ExpenseType.RECURRING:
                recurring += amount
            else:
                installment += amount
            if expense_ends_in_month(expense, year, month):
                ending.append(expense.name)

        total = recurring + installment
        projections.append(
            MonthProjection(
                month=target.strftime("%B"),
                year=year,
                month_number=month,
                expected_salary=salary,
                recurring_expenses=recurring,
                installment_expenses=installment,
                total_committed=total,
                estimated_balance=salary - total,
                ending_accounts=ending,
            )
        )

    return ProjectionResponse(months=projections, monthly_salary=salary)
