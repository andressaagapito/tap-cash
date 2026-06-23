"""payment method on expenses

Revision ID: 004
Revises: 003
Create Date: 2026-06-23

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

payment_method = postgresql.ENUM(
    "cartao_credito",
    "cartao_debito",
    "pix",
    "boleto",
    name="paymentmethod",
    create_type=False,
)


def upgrade() -> None:
    bind = op.get_bind()
    postgresql.ENUM(
        "cartao_credito",
        "cartao_debito",
        "pix",
        "boleto",
        name="paymentmethod",
    ).create(bind, checkfirst=True)

    op.add_column(
        "expenses",
        sa.Column(
            "payment_method",
            payment_method,
            nullable=False,
            server_default="cartao_credito",
        ),
    )


def downgrade() -> None:
    op.drop_column("expenses", "payment_method")
    payment_method_enum = postgresql.ENUM(name="paymentmethod")
    payment_method_enum.drop(op.get_bind(), checkfirst=True)
