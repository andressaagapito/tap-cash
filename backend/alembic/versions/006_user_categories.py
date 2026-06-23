"""user custom categories

Revision ID: 006
Revises: 005
Create Date: 2026-06-23

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

BUILTIN_CATEGORIES = (
    "food",
    "housing",
    "transport",
    "health",
    "education",
    "leisure",
    "clothing",
    "subscriptions",
    "other",
)


def upgrade() -> None:
    op.create_table(
        "user_categories",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "name", name="uq_user_categories_user_name"),
    )
    op.create_index(op.f("ix_user_categories_id"), "user_categories", ["id"], unique=False)

    builtin_list = ", ".join(f"'{key}'" for key in BUILTIN_CATEGORIES)
    op.execute(
        f"""
        INSERT INTO user_categories (user_id, name, created_at)
        SELECT DISTINCT e.user_id, e.category, NOW()
        FROM expenses e
        WHERE e.category NOT IN ({builtin_list})
        AND NOT EXISTS (
            SELECT 1 FROM user_categories uc
            WHERE uc.user_id = e.user_id AND LOWER(uc.name) = LOWER(e.category)
        )
        """
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_user_categories_id"), table_name="user_categories")
    op.drop_table("user_categories")
