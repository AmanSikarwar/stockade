from app.core.config import Settings


def test_settings_normalizes_render_postgres_url_to_psycopg_driver() -> None:
    settings = build_settings(database_url="postgresql://user:password@host:5432/stockade")

    assert settings.database_url == "postgresql+psycopg://user:password@host:5432/stockade"


def test_settings_preserves_explicit_psycopg_database_url() -> None:
    database_url = "postgresql+psycopg://user:password@host:5432/stockade"

    settings = build_settings(database_url=database_url)

    assert settings.database_url == database_url


def build_settings(database_url: str) -> Settings:
    return Settings(
        database_url=database_url,
        jwt_secret_key="test-secret-key-minimum-32-characters",
        default_organization_name="Stockade Test",
        admin_email="admin@example.com",
        admin_password="test-admin-password",
    )
