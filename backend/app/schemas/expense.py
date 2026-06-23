from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field, model_validator

from app.models.expense import ExpenseStatus, ExpenseType, PaymentMethod
from app.services.expense_calculator import get_max_installments

RECURRING_PAYMENT_METHODS = {
    PaymentMethod.PIX,
    PaymentMethod.BANK_SLIP,
    PaymentMethod.CREDIT_CARD,
}


class ExpenseCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    type: ExpenseType
    payment_method: PaymentMethod = PaymentMethod.CREDIT_CARD
    purchase_date: date
    total_amount: Decimal = Field(gt=0)
    installment_amount: Decimal | None = Field(default=None, gt=0)
    total_installments: int = Field(default=1, ge=1)
    recurrence_months: int | None = Field(default=None, ge=1)
    card_id: int | None = None
    category: str = Field(min_length=1, max_length=100)
    notes: str | None = None
    status: ExpenseStatus = ExpenseStatus.ACTIVE
    initial_paid_installments: int = Field(default=0, ge=0)

    @model_validator(mode="after")
    def validate_expense(self):
        if self.payment_method != PaymentMethod.CREDIT_CARD:
            self.card_id = None

        if self.payment_method == PaymentMethod.DEBIT_CARD:
            self.type = ExpenseType.ONE_TIME
            self.total_installments = 1
            self.recurrence_months = None

        if self.payment_method in {PaymentMethod.PIX, PaymentMethod.BANK_SLIP}:
            if self.type == ExpenseType.ONE_TIME:
                self.total_installments = 1
                self.recurrence_months = None

        if self.type == ExpenseType.RECURRING:
            if self.payment_method not in RECURRING_PAYMENT_METHODS:
                raise ValueError("payment_method_not_recurring")
            if self.installment_amount is None:
                self.installment_amount = self.total_amount
            if self.total_installments < 1:
                self.total_installments = 1
        elif self.type == ExpenseType.ONE_TIME:
            if self.installment_amount is None and self.total_installments > 0:
                self.installment_amount = (self.total_amount / self.total_installments).quantize(
                    Decimal("0.01")
                )
            elif self.installment_amount is None:
                self.installment_amount = self.total_amount

        if self.initial_paid_installments > 0:
            max_installments = get_max_installments(
                self.type, self.total_installments, self.recurrence_months
            )
            if max_installments is not None and self.initial_paid_installments > max_installments:
                raise ValueError("paid_installments_exceeds_total")

        return self


class ExpenseUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    type: ExpenseType | None = None
    payment_method: PaymentMethod | None = None
    purchase_date: date | None = None
    total_amount: Decimal | None = Field(default=None, gt=0)
    installment_amount: Decimal | None = Field(default=None, gt=0)
    total_installments: int | None = Field(default=None, ge=1)
    recurrence_months: int | None = Field(default=None, ge=1)
    card_id: int | None = None
    category: str | None = Field(default=None, min_length=1, max_length=100)
    notes: str | None = None
    status: ExpenseStatus | None = None
    initial_paid_installments: int | None = Field(default=None, ge=0)

    @model_validator(mode="after")
    def validate_expense(self):
        payment_method = self.payment_method
        expense_type = self.type

        if payment_method and payment_method != PaymentMethod.CREDIT_CARD:
            self.card_id = None

        if payment_method == PaymentMethod.DEBIT_CARD:
            self.type = ExpenseType.ONE_TIME
            self.total_installments = 1
            self.recurrence_months = None

        if (
            payment_method in {PaymentMethod.PIX, PaymentMethod.BANK_SLIP}
            and expense_type == ExpenseType.ONE_TIME
        ):
            self.total_installments = 1
            self.recurrence_months = None

        if expense_type == ExpenseType.RECURRING and payment_method:
            if payment_method not in RECURRING_PAYMENT_METHODS:
                raise ValueError("payment_method_not_recurring")

        return self


class InstallmentDetail(BaseModel):
    number: int
    due_date: date
    amount: Decimal
    status: str
    paid_by: str | None = None


class ExpenseResponse(BaseModel):
    id: int
    user_id: int
    card_id: int | None
    payment_method: PaymentMethod
    name: str
    type: ExpenseType
    purchase_date: date
    total_amount: Decimal
    installment_amount: Decimal
    total_installments: int
    recurrence_months: int | None
    category: str
    notes: str | None
    status: ExpenseStatus
    created_at: datetime
    updated_at: datetime
    paid_installments: int = 0
    pending_installments: int = 0
    manual_paid_installments: int = 0
    remaining_amount: Decimal = Decimal("0")
    expected_end_date: date | None = None
    next_due_date: date | None = None
    card_name: str | None = None

    model_config = {"from_attributes": True}


class ExpenseWithInstallments(ExpenseResponse):
    installments: list[InstallmentDetail] = []


class DashboardResponse(BaseModel):
    total_expenses: int
    monthly_committed: Decimal
    pending_installments_total: int
    estimated_monthly_balance: Decimal
    upcoming_bills: list[ExpenseResponse]
