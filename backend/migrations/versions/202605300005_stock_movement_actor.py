"""record acting user on stock movements

Revision ID: 202605300005
Revises: 202605300004
Create Date: 2026-05-31 00:00:05.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "202605300005"
down_revision: str | None = "202605300004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "stock_movements",
        sa.Column("created_by_user_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        op.f("fk_stock_movements_created_by_user_id_users"),
        "stock_movements",
        "users",
        ["created_by_user_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        op.f("fk_stock_movements_created_by_user_id_users"),
        "stock_movements",
        type_="foreignkey",
    )
    op.drop_column("stock_movements", "created_by_user_id")
