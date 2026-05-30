from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def get_by_email(self, email: str) -> User | None:
        return self.session.scalars(select(User).where(User.email == email)).one_or_none()

    def get_by_id(self, user_id: UUID, organization_id: UUID) -> User | None:
        return self.session.scalars(
            select(User).where(User.id == user_id, User.organization_id == organization_id)
        ).one_or_none()
