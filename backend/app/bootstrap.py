import logging

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.logging import configure_logging
from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.organization import Organization
from app.models.user import User

logger = logging.getLogger(__name__)


def seed_default_data(session: Session) -> None:
    settings = get_settings()

    organization_count = session.scalar(select(func.count(Organization.id))) or 0
    if organization_count == 0:
        organization = Organization(display_name=settings.default_organization_name)
        session.add(organization)
        session.flush()
        logger.info("seeded_default_organization", extra={"organization_id": str(organization.id)})
    elif organization_count == 1:
        organization = session.scalars(select(Organization).limit(1)).one()
    else:
        raise RuntimeError("bootstrap expected at most one organization")

    admin_user = session.scalars(
        select(User).where(
            User.organization_id == organization.id, User.email == settings.admin_email
        )
    ).one_or_none()
    if admin_user is None:
        admin_user = User(
            organization_id=organization.id,
            email=settings.admin_email,
            hashed_password=hash_password(settings.admin_password),
            role="admin",
        )
        session.add(admin_user)
        logger.info("seeded_admin_user", extra={"admin_email": settings.admin_email})


def main() -> None:
    settings = get_settings()
    configure_logging(settings.log_level)
    with SessionLocal() as session:
        seed_default_data(session)
        session.commit()


if __name__ == "__main__":
    main()
