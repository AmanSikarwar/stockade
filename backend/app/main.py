import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.router import api_router
from app.core.config import Settings, get_settings
from app.core.logging import configure_logging

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    configure_logging(settings.log_level)
    app.state.settings = settings
    logger.info("application_startup", extra={"environment": settings.environment})
    yield
    logger.info("application_shutdown")


def create_app() -> FastAPI:
    settings: Settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        summary="Self-hostable inventory and order management API.",
        version="0.1.0",
        lifespan=lifespan,
    )
    app.include_router(api_router)
    return app


app = create_app()
