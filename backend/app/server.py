import uvicorn

from app.core.config import get_settings


def main() -> None:
    settings = get_settings()
    uvicorn.run(
        "app.main:create_app",
        factory=True,
        host=settings.backend_host,
        port=settings.backend_port,
        log_level=settings.log_level.lower(),
    )


if __name__ == "__main__":
    main()
