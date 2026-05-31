"""add stock movement audit trail

Revision ID: 202605300004
Revises: 202605300003
Create Date: 2026-05-31 00:00:04.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "202605300004"
down_revision: str | None = "202605300003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

_REASONS = "'order', 'cancellation', 'manual', 'correction', 'restock', 'damage'"


def upgrade() -> None:
    op.create_table(
        "stock_movements",
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("product_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("reference_order_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("delta", sa.Integer(), nullable=False),
        sa.Column("resulting_quantity", sa.Integer(), nullable=False),
        sa.Column("reason", sa.String(length=32), nullable=False),
        sa.Column("note", sa.String(length=255), nullable=True),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint("delta <> 0", name=op.f("ck_stock_movements_delta_non_zero")),
        sa.CheckConstraint(
            "resulting_quantity >= 0",
            name=op.f("ck_stock_movements_resulting_quantity_non_negative"),
        ),
        sa.CheckConstraint(
            f"reason IN ({_REASONS})",
            name=op.f("ck_stock_movements_reason_allowed"),
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name=op.f("fk_stock_movements_organization_id_organizations"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
            name=op.f("fk_stock_movements_product_id_products"),
            ondelete="RESTRICT",
        ),
        sa.ForeignKeyConstraint(
            ["reference_order_id"],
            ["orders.id"],
            name=op.f("fk_stock_movements_reference_order_id_orders"),
            ondelete="SET NULL",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_stock_movements")),
    )
    op.create_index("ix_stock_movements_organization_id", "stock_movements", ["organization_id"])
    op.create_index("ix_stock_movements_product_id", "stock_movements", ["product_id"])
    op.create_index(
        "ix_stock_movements_organization_id_created_at",
        "stock_movements",
        ["organization_id", "created_at"],
    )


def downgrade() -> None:
    op.drop_index("ix_stock_movements_organization_id_created_at", table_name="stock_movements")
    op.drop_index("ix_stock_movements_product_id", table_name="stock_movements")
    op.drop_index("ix_stock_movements_organization_id", table_name="stock_movements")
    op.drop_table("stock_movements")
