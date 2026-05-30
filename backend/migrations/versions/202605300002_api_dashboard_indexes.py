"""add dashboard and list lookup indexes

Revision ID: 202605300002
Revises: 202605300001
Create Date: 2026-05-30 00:02:00.000000

"""

from collections.abc import Sequence

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "202605300002"
down_revision: str | None = "202605300001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_index(
        "ix_orders_organization_id_customer_id",
        "orders",
        ["organization_id", "customer_id"],
        unique=False,
    )
    op.create_index(
        "ix_orders_organization_id_status",
        "orders",
        ["organization_id", "status"],
        unique=False,
    )
    op.create_index(
        "ix_products_organization_id_active_quantity",
        "products",
        ["organization_id", "active", "quantity_in_stock"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_products_organization_id_active_quantity", table_name="products")
    op.drop_index("ix_orders_organization_id_status", table_name="orders")
    op.drop_index("ix_orders_organization_id_customer_id", table_name="orders")
