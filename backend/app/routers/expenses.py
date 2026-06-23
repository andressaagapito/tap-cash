from datetime import date, datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import get_current_user
from app.i18n.keys import (
    EXPENSE_NOT_FOUND,
    INSTALLMENT_ALREADY_PAID,
    INSTALLMENT_NOT_FOUND,
    INSTALLMENT_NOT_PAID,
    INVALID_CARD,
    PAID_INSTALLMENTS_EXCEEDS_TOTAL,
)
from app.models.card import Card
from app.models.expense import Expense, ExpenseStatus, ExpenseType
from app.models.expense_installment_payment import ExpenseInstallmentPayment
from app.models.financial_profile import UserFinancialProfile
from app.models.user import User
from app.schemas.expense import (
    DashboardResponse,
    ExpenseCreate,
    ExpenseResponse,
    ExpenseUpdate,
    ExpenseWithInstallments,
    InstallmentDetail,
)
from app.services.category import ensure_user_category
from app.services.expense_calculator import (
    build_installment_details,
    get_consecutive_manual_paid_count,
    get_expected_end_date,
    get_installment_counts,
    get_monthly_amount_for_expense,
    get_next_pending_installment,
    get_remaining_amount,
    is_open_debt,
)
from app.security.sql import LIKE_ESCAPE_CHAR, prepare_ilike_contains

router = APIRouter(prefix="/expenses", tags=["Expenses"])


def _get_auto_mark(db: Session, user_id: int) -> bool:
    profile = (
        db.query(UserFinancialProfile)
        .filter(UserFinancialProfile.user_id == user_id)
        .first()
    )
    return bool(profile and profile.auto_mark_installments_paid)


def _expense_query(db: Session, user_id: int):
    return (
        db.query(Expense)
        .options(joinedload(Expense.card), joinedload(Expense.installment_payments))
        .filter(Expense.user_id == user_id)
    )


def _expense_to_response(expense: Expense, auto_mark: bool = False) -> ExpenseResponse:
    paid, pending = get_installment_counts(expense, auto_mark=auto_mark)
    next_pending = get_next_pending_installment(expense, auto_mark=auto_mark)
    return ExpenseResponse(
        id=expense.id,
        user_id=expense.user_id,
        card_id=expense.card_id,
        payment_method=expense.payment_method,
        name=expense.name,
        type=expense.type,
        purchase_date=expense.purchase_date,
        total_amount=expense.total_amount,
        installment_amount=expense.installment_amount,
        total_installments=expense.total_installments,
        recurrence_months=expense.recurrence_months,
        category=expense.category,
        notes=expense.notes,
        status=expense.status,
        created_at=expense.created_at,
        updated_at=expense.updated_at,
        paid_installments=paid,
        pending_installments=pending,
        manual_paid_installments=get_consecutive_manual_paid_count(expense),
        remaining_amount=get_remaining_amount(expense, auto_mark=auto_mark),
        expected_end_date=get_expected_end_date(expense),
        next_due_date=next_pending["due_date"] if next_pending else None,
        card_name=expense.card.name if expense.card else None,
    )


def _expense_with_installments(expense: Expense, auto_mark: bool = False) -> ExpenseWithInstallments:
    base = _expense_to_response(expense, auto_mark).model_dump()
    installments = [
        InstallmentDetail(**item)
        for item in build_installment_details(expense, auto_mark=auto_mark)
    ]
    return ExpenseWithInstallments(**base, installments=installments)


def _get_user_expense(db: Session, expense_id: int, user_id: int) -> Expense:
    expense = _expense_query(db, user_id).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=EXPENSE_NOT_FOUND)
    return expense


def _validate_card(db: Session, card_id: int | None, user_id: int):
    if card_id is None:
        return
    card = db.query(Card).filter(Card.id == card_id, Card.user_id == user_id).first()
    if not card:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=INVALID_CARD)


@router.get("/dashboard", response_model=DashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    auto_mark = _get_auto_mark(db, current_user.id)
    expenses = _expense_query(db, current_user.id).all()
    open_debts = [e for e in expenses if is_open_debt(e, auto_mark)]

    today = date.today()
    monthly_committed = Decimal("0")
    pending_total = 0

    for expense in open_debts:
        monthly_committed += get_monthly_amount_for_expense(expense, today.year, today.month)
        _, pending = get_installment_counts(expense, auto_mark=auto_mark)
        pending_total += pending

    profile = (
        db.query(UserFinancialProfile)
        .filter(UserFinancialProfile.user_id == current_user.id)
        .first()
    )
    salary = profile.monthly_salary if profile else Decimal("0")

    upcoming = sorted(
        [_expense_to_response(e, auto_mark) for e in open_debts],
        key=lambda x: x.next_due_date or x.expected_end_date or date.max,
    )[:5]

    return DashboardResponse(
        total_expenses=len(open_debts),
        monthly_committed=monthly_committed,
        pending_installments_total=pending_total,
        estimated_monthly_balance=salary - monthly_committed,
        upcoming_bills=upcoming,
    )


@router.get("", response_model=list[ExpenseResponse])
def list_expenses(
    card_id: int | None = Query(None),
    status_filter: ExpenseStatus | None = Query(None, alias="status"),
    type_filter: ExpenseType | None = Query(None, alias="type"),
    search: str | None = Query(None, max_length=200),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    auto_mark = _get_auto_mark(db, current_user.id)
    query = _expense_query(db, current_user.id)

    if card_id:
        query = query.filter(Expense.card_id == card_id)
    if status_filter:
        query = query.filter(Expense.status == status_filter)
    if type_filter:
        query = query.filter(Expense.type == type_filter)
    if search:
        pattern = prepare_ilike_contains(search)
        query = query.filter(Expense.name.ilike(pattern, escape=LIKE_ESCAPE_CHAR))

    expenses = query.order_by(Expense.purchase_date.desc()).all()
    return [_expense_to_response(e, auto_mark) for e in expenses]


@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    data: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    auto_mark = _get_auto_mark(db, current_user.id)
    _validate_card(db, data.card_id, current_user.id)
    create_data = data.model_dump(exclude={"initial_paid_installments"})
    paid_count = data.initial_paid_installments
    expense = Expense(user_id=current_user.id, **create_data)
    db.add(expense)
    db.flush()
    if paid_count > 0:
        try:
            sync_manual_paid_installments(db, expense, paid_count)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=PAID_INSTALLMENTS_EXCEEDS_TOTAL,
            )
    ensure_user_category(db, current_user.id, data.category)
    db.commit()
    db.refresh(expense)
    expense = _get_user_expense(db, expense.id, current_user.id)
    return _expense_to_response(expense, auto_mark)


@router.get("/{expense_id}", response_model=ExpenseWithInstallments)
def get_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    auto_mark = _get_auto_mark(db, current_user.id)
    expense = _get_user_expense(db, expense_id, current_user.id)
    return _expense_with_installments(expense, auto_mark)


@router.get("/{expense_id}/installments", response_model=list[InstallmentDetail])
def list_installments(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    auto_mark = _get_auto_mark(db, current_user.id)
    expense = _get_user_expense(db, expense_id, current_user.id)
    return [InstallmentDetail(**item) for item in build_installment_details(expense, auto_mark=auto_mark)]


@router.patch("/{expense_id}/installments/{installment_number}/mark-paid", response_model=ExpenseWithInstallments)
def mark_installment_paid(
    expense_id: int,
    installment_number: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    auto_mark = _get_auto_mark(db, current_user.id)
    expense = _get_user_expense(db, expense_id, current_user.id)

    if expense.status != ExpenseStatus.ACTIVE:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=EXPENSE_NOT_FOUND)

    details = build_installment_details(expense, auto_mark=auto_mark)
    installment = next((d for d in details if d["number"] == installment_number), None)
    if not installment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=INSTALLMENT_NOT_FOUND)

    if installment["status"] == "paid":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=INSTALLMENT_ALREADY_PAID)

    existing = next(
        (p for p in expense.installment_payments if p.installment_number == installment_number),
        None,
    )
    if not existing:
        payment = ExpenseInstallmentPayment(
            expense_id=expense.id,
            installment_number=installment_number,
            paid_at=datetime.now(timezone.utc),
        )
        db.add(payment)

    db.commit()
    expense = _get_user_expense(db, expense_id, current_user.id)
    return _expense_with_installments(expense, auto_mark)


@router.patch("/{expense_id}/installments/{installment_number}/mark-unpaid", response_model=ExpenseWithInstallments)
def mark_installment_unpaid(
    expense_id: int,
    installment_number: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    auto_mark = _get_auto_mark(db, current_user.id)
    expense = _get_user_expense(db, expense_id, current_user.id)

    payment = next(
        (p for p in expense.installment_payments if p.installment_number == installment_number),
        None,
    )
    if not payment:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=INSTALLMENT_NOT_PAID)

    db.delete(payment)
    db.commit()
    expense = _get_user_expense(db, expense_id, current_user.id)
    return _expense_with_installments(expense, auto_mark)


@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    data: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    auto_mark = _get_auto_mark(db, current_user.id)
    expense = _get_user_expense(db, expense_id, current_user.id)
    update_data = data.model_dump(exclude_unset=True)
    paid_count = update_data.pop("initial_paid_installments", None)
    status_value = update_data.pop("status", None)
    if "card_id" in update_data:
        _validate_card(db, update_data["card_id"], current_user.id)
    for field, value in update_data.items():
        setattr(expense, field, value)
    db.flush()
    if paid_count is not None:
        try:
            sync_manual_paid_installments(
                db,
                expense,
                paid_count,
                adjust_status=status_value is None,
            )
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=PAID_INSTALLMENTS_EXCEEDS_TOTAL,
            )
    if status_value is not None:
        expense.status = status_value
    if "category" in update_data:
        ensure_user_category(db, current_user.id, update_data["category"])
    db.commit()
    expense = _get_user_expense(db, expense_id, current_user.id)
    return _expense_to_response(expense, auto_mark)


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    expense = _get_user_expense(db, expense_id, current_user.id)
    db.delete(expense)
    db.commit()


@router.patch("/{expense_id}/mark-as-paid", response_model=ExpenseResponse)
def mark_as_paid(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    auto_mark = _get_auto_mark(db, current_user.id)
    expense = _get_user_expense(db, expense_id, current_user.id)
    expense.status = ExpenseStatus.PAID_OFF
    db.commit()
    expense = _get_user_expense(db, expense_id, current_user.id)
    return _expense_to_response(expense, auto_mark)
