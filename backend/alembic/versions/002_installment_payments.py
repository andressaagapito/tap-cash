"""initial schema

Revision ID: 002
Revises: 001
Create Date: 2026-06-23

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "user_financial_profiles",
        sa.Column("auto_mark_installments_paid", sa.Boolean(), nullable=False, server_default="false"),
    )

    op.create_table(
        "expense_installment_payments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("expense_id", sa.Integer(), nullable=False),
        sa.Column("installment_number", sa.Integer(), nullable=False),
        sa.Column("paid_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["expense_id"], ["expenses.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("expense_id", "installment_number", name="uq_expense_installment"),
    )
    op.create_index(
        op.f("ix_expense_installment_payments_id"),
        "expense_installment_payments",
        ["id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_expense_installment_payments_id"), table_name="expense_installment_payments")
    op.drop_table("expense_installment_payments")
    op.drop_column("user_financial_profiles", "auto_mark_installments_paid")
