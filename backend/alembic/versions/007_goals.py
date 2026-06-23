"""goals and goal options

Revision ID: 007
Revises: 006
Create Date: 2026-06-23

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "007"
down_revision: Union[str, None] = "006"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

goal_priority = postgresql.ENUM("low", "medium", "high", name="goalpriority", create_type=False)
goal_category = postgresql.ENUM(
    "car", "travel", "reserve", "debt", "house", "education", "health", "other",
    name="goalcategory",
    create_type=False,
)
goal_status = postgresql.ENUM("active", "completed", "cancelled", name="goalstatus", create_type=False)
goal_option_status = postgresql.ENUM(
    "analyzing", "chosen", "discarded", name="goaloptionstatus", create_type=False
)


def upgrade() -> None:
    bind = op.get_bind()
    postgresql.ENUM("low", "medium", "high", name="goalpriority").create(bind, checkfirst=True)
    postgresql.ENUM(
        "car", "travel", "reserve", "debt", "house", "education", "health", "other",
        name="goalcategory",
    ).create(bind, checkfirst=True)
    postgresql.ENUM("active", "completed", "cancelled", name="goalstatus").create(bind, checkfirst=True)
    postgresql.ENUM("analyzing", "chosen", "discarded", name="goaloptionstatus").create(
        bind, checkfirst=True
    )

    op.create_table(
        "goals",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("target_amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("saved_amount", sa.Numeric(precision=12, scale=2), nullable=False, server_default="0"),
        sa.Column("deadline", sa.Date(), nullable=True),
        sa.Column("priority", goal_priority, nullable=False, server_default="medium"),
        sa.Column("category", goal_category, nullable=False, server_default="other"),
        sa.Column("status", goal_status, nullable=False, server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_goals_id"), "goals", ["id"], unique=False)

    op.create_table(
        "goal_options",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("goal_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.Column("estimated_amount", sa.Numeric(precision=12, scale=2), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("reference_link", sa.String(length=500), nullable=True),
        sa.Column("status", goal_option_status, nullable=False, server_default="analyzing"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["goal_id"], ["goals.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_goal_options_id"), "goal_options", ["id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_goal_options_id"), table_name="goal_options")
    op.drop_table("goal_options")
    op.drop_index(op.f("ix_goals_id"), table_name="goals")
    op.drop_table("goals")
    bind = op.get_bind()
    postgresql.ENUM(name="goaloptionstatus").drop(bind, checkfirst=True)
    postgresql.ENUM(name="goalstatus").drop(bind, checkfirst=True)
    postgresql.ENUM(name="goalcategory").drop(bind, checkfirst=True)
    postgresql.ENUM(name="goalpriority").drop(bind, checkfirst=True)
