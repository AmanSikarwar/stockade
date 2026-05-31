"""add categories and product reorder point

Revision ID: 202605300003
Revises: 202605300002
Create Date: 2026-05-31 00:00:03.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "202605300003"
down_revision: str | None = "202605300002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "categories",
        sa.Column("organization_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            name=op.f("fk_categories_organization_id_organizations"),
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_categories")),
        sa.UniqueConstraint("organization_id", "name", name="uq_categories_organization_id_name"),
    )
    op.create_index("ix_categories_organization_id", "categories", ["organization_id"])

    op.add_column(
        "products",
        sa.Column("category_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.add_column("products", sa.Column("reorder_point", sa.Integer(), nullable=True))
    op.create_foreign_key(
        op.f("fk_products_category_id_categories"),
        "products",
        "categories",
        ["category_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_check_constraint(
        op.f("ck_products_reorder_point_non_negative"),
        "products",
        "reorder_point IS NULL OR reorder_point >= 0",
    )
    op.create_index("ix_products_category_id", "products", ["category_id"])


def downgrade() -> None:
    op.drop_index("ix_products_category_id", table_name="products")
    op.drop_constraint(op.f("ck_products_reorder_point_non_negative"), "products", type_="check")
    op.drop_constraint(op.f("fk_products_category_id_categories"), "products", type_="foreignkey")
    op.drop_column("products", "reorder_point")
    op.drop_column("products", "category_id")
    op.drop_index("ix_categories_organization_id", table_name="categories")
    op.drop_table("categories")
