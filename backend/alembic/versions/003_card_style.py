"""card style fields

Revision ID: 003
Revises: 002
Create Date: 2026-06-23

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "cards",
        sa.Column("color", sa.String(length=7), nullable=False, server_default="#3B82F6"),
    )
    op.add_column(
        "cards",
        sa.Column("icon", sa.String(length=50), nullable=False, server_default="credit-card"),
    )


def downgrade() -> None:
    op.drop_column("cards", "icon")
    op.drop_column("cards", "color")
