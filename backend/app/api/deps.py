from collections.abc import Generator
from dataclasses import dataclass
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.config import Settings, get_settings
from app.core.security import decode_access_token
from app.db.session import SessionLocal
from app.models.user import User
from app.repositories.users import UserRepository

bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class CurrentUser:
    user: User
    organization_id: UUID


def get_db_session() -> Generator[Session]:
    with SessionLocal() as session:
        yield session


def credentials_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    session: Annotated[Session, Depends(get_db_session)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> CurrentUser:
    if credentials is None:
        raise credentials_error()

    try:
        payload = decode_access_token(credentials.credentials, settings)
        user_id = UUID(str(payload["sub"]))
        organization_id = UUID(str(payload["org"]))
    except KeyError, TypeError, ValueError:
        raise credentials_error() from None

    user = UserRepository(session).get_by_id(user_id=user_id, organization_id=organization_id)
    if user is None:
        raise credentials_error()

    return CurrentUser(user=user, organization_id=organization_id)
