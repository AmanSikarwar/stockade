from typing import Annotated

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import CurrentUser, get_current_user, get_db_session
from app.api.errors import http_error
from app.core.config import Settings, get_settings
from app.schemas.auth import LoginRequest, TokenResponse, UserResponse
from app.services.auth import authenticate_user, issue_access_token

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse, summary="Authenticate user")
def login(
    payload: LoginRequest,
    session: Annotated[Session, Depends(get_db_session)],
    settings: Annotated[Settings, Depends(get_settings)],
) -> TokenResponse:
    user = authenticate_user(session, email=payload.email, password=payload.password)
    if user is None:
        raise http_error(
            status.HTTP_401_UNAUTHORIZED,
            "invalid_credentials",
            "Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return issue_access_token(user=user, settings=settings)


@router.get("/me", response_model=UserResponse, summary="Get current user")
def read_current_user(
    current_user: Annotated[CurrentUser, Depends(get_current_user)],
) -> UserResponse:
    user = current_user.user
    return UserResponse(
        id=user.id,
        organization_id=current_user.organization_id,
        email=user.email,
        role=user.role,
    )
