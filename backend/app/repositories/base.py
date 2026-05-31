from collections.abc import Mapping
from uuid import UUID

from sqlalchemy.orm import InstrumentedAttribute, Session
from sqlalchemy.sql.elements import UnaryExpression


class OrganizationScopedRepository:
    def __init__(self, session: Session, organization_id: UUID) -> None:
        self.session = session
        self.organization_id = organization_id


def resolve_order(
    sortable: Mapping[str, InstrumentedAttribute],
    default_column: InstrumentedAttribute,
    sort_by: str | None,
    sort_dir: str,
) -> UnaryExpression:
    column = sortable.get(sort_by, default_column) if sort_by else default_column
    return column.asc() if sort_dir == "asc" else column.desc()
