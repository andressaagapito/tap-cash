from uuid import UUID, uuid4
import enum
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ExpenseType(str, enum.Enum):
    ONE_TIME = "one_time"
    RECURRING = "recurring"


class ExpenseStatus(str, enum.Enum):
    ACTIVE = "active"
    PAID_OFF = "paid_off"
    CANCELLED = "cancelled"


class PaymentMethod(str, enum.Enum):
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    PIX = "pix"
    BANK_SLIP = "bank_slip"


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    uuid: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        unique=True,
        index=True,
        nullable=False,
        default=uuid4,
        server_default=text("gen_random_uuid()"),
    )
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    card_id: Mapped[int | None] = mapped_column(ForeignKey("cards.id", ondelete="SET NULL"), nullable=True)
    payment_method: Mapped[PaymentMethod] = mapped_column(
        Enum(PaymentMethod, values_callable=lambda enum: [item.value for item in enum]),
        nullable=False,
        default=PaymentMethod.CREDIT_CARD,
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    type: Mapped[ExpenseType] = mapped_column(
        Enum(ExpenseType, values_callable=lambda enum: [item.value for item in enum]),
        nullable=False,
    )
    purchase_date: Mapped[date] = mapped_column(Date, nullable=False)
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    installment_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    total_installments: Mapped[int] = mapped_column(Integer, default=1)
    recurrence_months: Mapped[int | None] = mapped_column(Integer, nullable=True)
    category: Mapped[str] = mapped_column(String(100), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[ExpenseStatus] = mapped_column(
        Enum(ExpenseStatus, values_callable=lambda enum: [item.value for item in enum]),
        default=ExpenseStatus.ACTIVE,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User", back_populates="expenses")
    card = relationship("Card", back_populates="expenses")
    installment_payments = relationship(
        "ExpenseInstallmentPayment",
        back_populates="expense",
        cascade="all, delete-orphan",
    )
