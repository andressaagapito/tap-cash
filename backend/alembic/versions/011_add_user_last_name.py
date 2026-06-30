"""add_user_last_name

Revision ID: 011
Revises: 010
Create Date: 2026-06-30 14:26:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "011"
down_revision = "010"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('users', sa.Column('last_name', sa.String(length=120), nullable=True))


def downgrade() -> None:
    op.drop_column('users', 'last_name')
