# Stockade Backend

Stockade is a self-hostable inventory and order management system for small
operations teams. This Docker image contains the FastAPI backend API, Alembic
migrations, and the idempotent bootstrap command that creates the initial
organization and admin user.

This image is the backend only. The frontend is a separate React/Vite app.

## Links

- GitHub: https://github.com/AmanSikarwar/stockade
- Live app: https://stockade-delta.vercel.app/app
- Live backend: https://stockade-backend-production.up.railway.app/
- API docs: https://stockade-backend-production.up.railway.app/docs
- Docker Hub: https://hub.docker.com/r/amansikarwar/stockade-backend

## Pull

```bash
docker pull amansikarwar/stockade-backend:latest
```

Versioned releases are published as semantic tags when available, for example:

```bash
docker pull amansikarwar/stockade-backend:0.1.0
```

## What The Backend Provides

- JWT authentication with Argon2 password hashing.
- Product catalog with SKU, price, quantity, category, reorder point, and active
  state.
- Category management with product counts.
- Customer management.
- Multi-line order creation with server-computed totals.
- Stock decrement on order creation and stock restoration on cancellation.
- Append-only stock movement audit trail.
- Dashboard metrics and low-stock alerts.
- Revenue, top-product, and customer-sales reports.
- OpenAPI documentation at `/docs`.

## Required Runtime Services

The container requires a PostgreSQL database. The app does not embed a database
or any secrets.

## Required Environment Variables

```text
DATABASE_URL=postgresql+psycopg://user:password@host:5432/stockade
JWT_SECRET_KEY=replace-with-secret-at-least-32-characters
DEFAULT_ORGANIZATION_NAME=Stockade
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=replace-with-initial-admin-password
CORS_ORIGINS=https://your-frontend.example.com
```

Notes:

- `JWT_SECRET_KEY` must be at least 32 characters.
- `ADMIN_PASSWORD` must be at least 12 characters.
- Set production-grade values before the first boot.
- Bootstrap is idempotent and does not overwrite an existing admin password.
- Keep `CORS_ORIGINS` scoped to known frontend origins only.

## Optional Environment Variables

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

`DATABASE_URL` may use `postgres://`, `postgresql://`, or
`postgresql+psycopg://`; the backend normalizes PostgreSQL URLs for psycopg.

## Run With Docker

Start a PostgreSQL container:

```bash
docker network create stockade

docker run -d --name stockade-postgres \
  --network stockade \
  -e POSTGRES_DB=stockade \
  -e POSTGRES_USER=stockade \
  -e POSTGRES_PASSWORD=replace-with-postgres-password \
  -v stockade_postgres_data:/var/lib/postgresql/data \
  postgres:18.4-alpine3.23
```

Start the Stockade backend:

```bash
docker run -d --name stockade-backend \
  --network stockade \
  -p 8000:8000 \
  -e DATABASE_URL='postgresql+psycopg://stockade:replace-with-postgres-password@stockade-postgres:5432/stockade' \
  -e JWT_SECRET_KEY='replace-with-secret-at-least-32-characters' \
  -e DEFAULT_ORGANIZATION_NAME='Stockade' \
  -e ADMIN_EMAIL='admin@example.com' \
  -e ADMIN_PASSWORD='replace-with-initial-admin-password' \
  -e CORS_ORIGINS='http://localhost:5173' \
  amansikarwar/stockade-backend:latest
```

Verify:

```bash
curl -sS http://localhost:8000/ready
curl -sS http://localhost:8000/docs
```

## Docker Compose Example

```yaml
services:
  db:
    image: postgres:18.4-alpine3.23
    environment:
      POSTGRES_DB: stockade
      POSTGRES_USER: stockade
      POSTGRES_PASSWORD: replace-with-postgres-password
    volumes:
      - stockade_postgres_data:/var/lib/postgresql/data

  backend:
    image: amansikarwar/stockade-backend:latest
    depends_on:
      - db
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql+psycopg://stockade:replace-with-postgres-password@db:5432/stockade
      JWT_SECRET_KEY: replace-with-secret-at-least-32-characters
      DEFAULT_ORGANIZATION_NAME: Stockade
      ADMIN_EMAIL: admin@example.com
      ADMIN_PASSWORD: replace-with-initial-admin-password
      CORS_ORIGINS: http://localhost:5173

volumes:
  stockade_postgres_data:
```

## Startup Behavior

The default container command runs:

1. `alembic upgrade head`
2. `python -m app.bootstrap`
3. `uvicorn --factory app.main:create_app`

This means every boot applies pending migrations before starting the API.

## Health Checks

- Readiness: `/ready`
- Liveness: `/health`
- OpenAPI docs: `/docs`
- OpenAPI JSON: `/openapi.json`

## Security Notes

- No secrets are embedded in the image.
- The image runs as a non-root `stockade` user.
- Passwords are hashed with Argon2.
- Access tokens are signed, expiring JWTs.
- Configure `CORS_ORIGINS` to known frontend origins only.

## Local Full-Stack Development

The source repository includes a complete local Docker Compose stack with
PostgreSQL, backend, and frontend:

```bash
git clone https://github.com/AmanSikarwar/stockade.git
cd stockade
cp .env.example .env
docker compose --env-file .env up --build
```

Local URLs:

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API docs: http://localhost:8000/docs

Local seeded admin:

```text
Email: admin@example.com
Password: local-dev-admin-password
```
