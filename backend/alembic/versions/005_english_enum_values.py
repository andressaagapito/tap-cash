"""rename enum values to english

Revision ID: 005
Revises: 004
Create Date: 2026-06-23

"""
from typing import Sequence, Union

from alembic import op

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE expensestatus RENAME VALUE 'ativa' TO 'active'")
    op.execute("ALTER TYPE expensestatus RENAME VALUE 'quitada' TO 'paid_off'")
    op.execute("ALTER TYPE expensestatus RENAME VALUE 'cancelada' TO 'cancelled'")

    op.execute("ALTER TYPE expensetype RENAME VALUE 'pontual' TO 'one_time'")
    op.execute("ALTER TYPE expensetype RENAME VALUE 'recorrente' TO 'recurring'")

    op.execute("ALTER TYPE paymentmethod RENAME VALUE 'cartao_credito' TO 'credit_card'")
    op.execute("ALTER TYPE paymentmethod RENAME VALUE 'cartao_debito' TO 'debit_card'")
    op.execute("ALTER TYPE paymentmethod RENAME VALUE 'boleto' TO 'bank_slip'")

    op.alter_column("expenses", "payment_method", server_default="credit_card")


def downgrade() -> None:
    op.alter_column("expenses", "payment_method", server_default="cartao_credito")

    op.execute("ALTER TYPE paymentmethod RENAME VALUE 'bank_slip' TO 'boleto'")
    op.execute("ALTER TYPE paymentmethod RENAME VALUE 'debit_card' TO 'cartao_debito'")
    op.execute("ALTER TYPE paymentmethod RENAME VALUE 'credit_card' TO 'cartao_credito'")

    op.execute("ALTER TYPE expensetype RENAME VALUE 'recurring' TO 'recorrente'")
    op.execute("ALTER TYPE expensetype RENAME VALUE 'one_time' TO 'pontual'")

    op.execute("ALTER TYPE expensestatus RENAME VALUE 'cancelled' TO 'cancelada'")
    op.execute("ALTER TYPE expensestatus RENAME VALUE 'paid_off' TO 'quitada'")
    op.execute("ALTER TYPE expensestatus RENAME VALUE 'active' TO 'ativa'")
