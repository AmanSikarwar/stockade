from sqlalchemy.orm import Session

from app.core.config import Settings
from app.core.security import create_access_token, verify_password
from app.models.user import User
from app.repositories.users import UserRepository
from app.schemas.auth import TokenResponse


def authenticate_user(session: Session, email: str, password: str) -> User | None:
    user = UserRepository(session).get_by_email(email)
    if user is None:
        return None

    if not verify_password(user.hashed_password, password):
        return None

    return user


def issue_access_token(user: User, settings: Settings) -> TokenResponse:
    access_token = create_access_token(
        subject=str(user.id),
        organization_id=str(user.organization_id),
        settings=settings,
    )
    expires_in = settings.access_token_expire_minutes * 60
    return TokenResponse(access_token=access_token, expires_in=expires_in)
