import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import Settings, get_settings
from app.core.logging import configure_logging

logger = logging.getLogger(__name__)


async def request_validation_error_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    errors = [
        {
            "loc": error.get("loc", []),
            "msg": error.get("msg", "Invalid value"),
            "type": error.get("type", "value_error"),
        }
        for error in exc.errors()
    ]
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={
            "detail": {
                "code": "invalid_request",
                "message": "Invalid request body or parameters",
                "errors": errors,
            }
        },
    )


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
    app.add_exception_handler(RequestValidationError, request_validation_error_handler)
    app.include_router(api_router)
    return app


app = create_app()
