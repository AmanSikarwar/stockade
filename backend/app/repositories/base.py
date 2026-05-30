from uuid import UUID

from sqlalchemy.orm import Session


class OrganizationScopedRepository:
    def __init__(self, session: Session, organization_id: UUID) -> None:
        self.session = session
        self.organization_id = organization_id
