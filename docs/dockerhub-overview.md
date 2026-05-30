# Stockade Backend Docker Image

Stockade is a self-hostable inventory and order management system. This image
contains the FastAPI backend API, Alembic migrations, and the idempotent
bootstrap command for the default organization and admin user.

## Image

```bash
docker pull <namespace>/stockade-backend:latest
docker pull <namespace>/stockade-backend:0.1.0
```

Replace `<namespace>` with the Docker Hub namespace used for the public
repository.

## Runtime Requirements

The image expects a PostgreSQL database and these environment variables:

```text
DATABASE_URL=postgresql+psycopg://user:password@host:5432/stockade
JWT_SECRET_KEY=<secret-at-least-32-characters>
DEFAULT_ORGANIZATION_NAME=<organization-name>
ADMIN_EMAIL=<admin-email>
ADMIN_PASSWORD=<initial-admin-password>
CORS_ORIGINS=<comma-separated-frontend-origins>
```

Optional variables:

```text
APP_NAME=Stockade API
ENVIRONMENT=production
LOG_LEVEL=INFO
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
LOW_STOCK_THRESHOLD=5
```

If the hosting platform provides `PORT`, the container uses it when
`BACKEND_PORT` is not set.

## Startup Behavior

The default command runs:

1. `alembic upgrade head`
2. `python -m app.bootstrap`
3. `uvicorn --factory app.main:create_app`

The bootstrap is idempotent: it creates the default organization only when none
exists and creates the configured admin user only when missing.

## Health Checks

- Readiness: `/ready`
- Liveness: `/health`
- OpenAPI docs: `/docs`

## Security Notes

- No secrets are embedded in the image.
- The image runs as a non-root `stockade` user.
- Passwords are hashed with Argon2.
- Tokens are signed, expiring JWTs.
- Configure `CORS_ORIGINS` to known frontend origins only.

## Source

GitHub repository: `<repository-url>`
