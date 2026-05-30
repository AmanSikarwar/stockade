# Stockade

Stockade is a self-hostable inventory and order management system. It provides
product, customer, order, inventory, and dashboard workflows behind an
authenticated FastAPI API and a React frontend.

The local stack runs with one Docker Compose command and includes PostgreSQL,
the backend API, and the production-built frontend.

## Current Status

- Local full-stack orchestration is complete and verified.
- Backend image publishing automation is configured in
  `.github/workflows/publish-backend-image.yml`; it still requires Docker Hub
  repository variables and a token.
- Hosted backend deployment is configured in `render.yaml`; it still requires a
  Render account and production secret values.
- Hosted frontend routing is configured in `frontend/vercel.json`; deployment
  still requires a Vercel project and the deployed backend public URL.
- CI is configured in `.github/workflows/ci.yml` for backend tests and frontend
  lint/format/build checks.

Do not use the local example passwords or JWT secret outside local development.

## Architecture

The repository is a monorepo:

```text
backend/    FastAPI API, SQLAlchemy models, Alembic migrations, tests
frontend/   Vite React app, API client, server-state hooks, production Nginx image
infra/      Reserved for infrastructure notes and future platform config
compose.yaml
```

The backend keeps route handlers thin. Business rules live in services, and
persistence access is funneled through repositories. Every business entity is
organization-scoped from day one, so the current single-tenant deployment can
evolve toward multi-tenancy without rewriting the domain model.

The frontend uses a Stockade-specific design language derived from the
`Stockade-design/` reference folder: pine and sage colors, compact operational
layouts, accessible forms, status badges, and reusable table/panel primitives.

## Stack And Pinned Versions

Backend:

- Python `3.14.5`
- FastAPI `0.136.3`
- Pydantic `2.13.4`
- Pydantic Settings `2.14.1`
- SQLAlchemy `2.0.50`
- Alembic `1.18.4`
- psycopg `3.3.4`
- Uvicorn `0.48.0`
- PyJWT `2.13.0`
- argon2-cffi `25.1.0`
- Backend image base: `python:3.14.5-slim`

Frontend:

- Node image base: `node:24.16.0-alpine3.23`
- React `19.2.6`
- React DOM `19.2.6`
- React Router `7.16.0`
- TanStack Query `5.100.14`
- Vite `8.0.14`
- Nginx runtime image: `nginx:1.31.1-alpine3.23-slim`

Database and orchestration:

- PostgreSQL image: `postgres:18.4-alpine3.23`
- Docker Compose with healthcheck-based service ordering
- Named volume: `stockade_postgres_data`

## Local Setup

Prerequisites:

- Docker with Docker Compose
- Git

Start the full stack:

```bash
cp .env.example .env
docker compose --env-file .env up --build
```

Open:

- Frontend: `http://localhost:5173`
- API readiness: `http://localhost:8000/ready`
- API docs: `http://localhost:8000/docs`

Local seeded admin:

- Email: `admin@example.com`
- Password: `local-dev-admin-password`

Stop the stack:

```bash
docker compose --env-file .env down
```

Stop and remove local database data:

```bash
docker compose --env-file .env down -v
```

## Environment Variables

Root `.env.example` is used by Docker Compose for local development.

| Variable                      | Required | Used by          | Description                                              |
| ----------------------------- | -------- | ---------------- | -------------------------------------------------------- |
| `APP_NAME`                    | No       | Backend          | Display name for logs/docs.                              |
| `ENVIRONMENT`                 | No       | Backend          | `local`, `test`, `staging`, or `production`.             |
| `LOG_LEVEL`                   | No       | Backend          | Structured logging level.                                |
| `POSTGRES_DB`                 | Yes      | Compose DB       | Local PostgreSQL database name.                          |
| `POSTGRES_USER`               | Yes      | Compose DB       | Local PostgreSQL username.                               |
| `POSTGRES_PASSWORD`           | Yes      | Compose DB       | Local PostgreSQL password.                               |
| `POSTGRES_PORT`               | No       | Local docs/tests | Local host port convention.                              |
| `BACKEND_HOST`                | No       | Backend          | Bind host, usually `0.0.0.0` in containers.              |
| `BACKEND_PORT`                | No       | Backend/Compose  | Backend bind and published port.                         |
| `PORT`                        | No       | Hosted backend   | Platform-provided port; used if `BACKEND_PORT` is unset. |
| `DATABASE_URL`                | Yes      | Backend          | SQLAlchemy PostgreSQL URL.                               |
| `JWT_SECRET_KEY`              | Yes      | Backend          | Signing key; minimum 32 characters.                      |
| `JWT_ALGORITHM`               | No       | Backend          | JWT signing algorithm, default `HS256`.                  |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No       | Backend          | Token lifetime in minutes.                               |
| `DEFAULT_ORGANIZATION_NAME`   | Yes      | Bootstrap        | Seeded organization display name.                        |
| `ADMIN_EMAIL`                 | Yes      | Bootstrap/Auth   | Seeded admin email.                                      |
| `ADMIN_PASSWORD`              | Yes      | Bootstrap/Auth   | Seeded admin password.                                   |
| `CORS_ORIGINS`                | Yes      | Backend          | Comma-separated allowed frontend origins.                |
| `LOW_STOCK_THRESHOLD`         | No       | Dashboard        | Quantity threshold for low-stock metrics.                |
| `FRONTEND_PORT`               | No       | Compose frontend | Local frontend published port.                           |
| `VITE_API_BASE_URL`           | Yes      | Frontend build   | Public browser URL for the backend API.                  |

Production deployments must provide their own secret values and should not use
the local defaults.

## Data Model

`organizations`

- Seeded exactly once at bootstrap.
- Owns users, products, customers, and orders.

`users`

- Belongs to an organization.
- Stores email, role, timestamps, and an Argon2 password hash.

`products`

- Belongs to an organization.
- Stores name, SKU, exact decimal price, non-negative stock quantity, active
  flag, and timestamps.
- Enforces unique `(organization_id, sku)`.

`customers`

- Belongs to an organization.
- Stores full name, validated email, optional phone number, and timestamps.
- Enforces unique `(organization_id, email)`.

`orders`

- Belongs to an organization and references a customer.
- Stores status, exact decimal server-computed total, and timestamps.

`order_line_items`

- Belongs to an order and references a product.
- Stores quantity, unit-price snapshot, and exact decimal line total.

## Business Decisions

- Product SKU and customer email are unique per organization, not globally.
- Product deletion is hard delete only when no order references exist; otherwise
  the product is marked inactive for history.
- Customer deletion is rejected when existing orders would be orphaned.
- Order totals are always computed server-side.
- Order lines keep unit-price snapshots so historical orders are unaffected by
  later price changes.
- Order creation validates all line items and stock before committing any write.
- Stock decrement and stock restoration happen in the same transaction as order
  creation and cancellation.
- List endpoints are paginated and default to sensible descending ordering.
- API errors use structured `detail` objects with stable error `code` values.

## API Reference

Swagger/OpenAPI is generated by the live backend at `/docs` and `/openapi.json`.

All business endpoints require:

```http
Authorization: Bearer <access_token>
```

Endpoints:

| Method   | Path              | Notes                                              |
| -------- | ----------------- | -------------------------------------------------- |
| `GET`    | `/health`         | Liveness.                                          |
| `GET`    | `/ready`          | Readiness.                                         |
| `POST`   | `/auth/login`     | Body: `email`, `password`.                         |
| `POST`   | `/products`       | Create product.                                    |
| `GET`    | `/products`       | Query: `limit`, `offset`, `q`, `include_inactive`. |
| `GET`    | `/products/{id}`  | Get product.                                       |
| `PUT`    | `/products/{id}`  | Partial product update.                            |
| `DELETE` | `/products/{id}`  | Hard delete or soft delete.                        |
| `POST`   | `/customers`      | Create customer.                                   |
| `GET`    | `/customers`      | Query: `limit`, `offset`, `q`.                     |
| `GET`    | `/customers/{id}` | Get customer.                                      |
| `DELETE` | `/customers/{id}` | Delete if no order conflict.                       |
| `POST`   | `/orders`         | Create multi-line order.                           |
| `GET`    | `/orders`         | Query: `limit`, `offset`, `status`, `customer_id`. |
| `GET`    | `/orders/{id}`    | Get order with line items.                         |
| `DELETE` | `/orders/{id}`    | Cancel order and restore stock.                    |
| `GET`    | `/dashboard`      | Summary and low-stock metrics.                     |

Example login:

```bash
curl -sS http://localhost:8000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"local-dev-admin-password"}'
```

## Scripted Walkthrough

Run this after the local stack is up.

```bash
TOKEN=$(curl -sS http://localhost:8000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"local-dev-admin-password"}' \
  | python -c 'import json,sys; print(json.load(sys.stdin)["access_token"])')

PRODUCT_ID=$(curl -sS http://localhost:8000/products \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Packing tape","sku":"TAPE-001","price":"4.25","quantity_in_stock":5}' \
  | python -c 'import json,sys; print(json.load(sys.stdin)["id"])')

CUSTOMER_ID=$(curl -sS http://localhost:8000/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"full_name":"Grace Hopper","email":"grace@example.com","phone_number":"+1-555-0100"}' \
  | python -c 'import json,sys; print(json.load(sys.stdin)["id"])')

curl -sS http://localhost:8000/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"customer_id\":\"$CUSTOMER_ID\",\"line_items\":[{\"product_id\":\"$PRODUCT_ID\",\"quantity\":2}]}"

curl -sS http://localhost:8000/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

The created order decrements product stock by `2`; cancelling the order from the
UI or `DELETE /orders/{id}` restores that stock.

## Tests And Checks

Install local Python tooling:

```bash
python3.14 -m venv .venv
. .venv/bin/activate
python -m pip install -r backend/requirements-dev.txt
```

Run backend tests against a disposable PostgreSQL container:

```bash
docker run --rm -d --name stockade-test-postgres \
  -e POSTGRES_DB=stockade_test \
  -e POSTGRES_USER=stockade \
  -e POSTGRES_PASSWORD=local-dev-postgres-password \
  -p 55433:5432 \
  postgres:18.4-alpine3.23

until docker exec stockade-test-postgres pg_isready -U stockade -d stockade_test; do sleep 1; done

TEST_DATABASE_URL=postgresql+psycopg://stockade:local-dev-postgres-password@localhost:55433/stockade_test \
  .venv/bin/python -m pytest backend/tests

docker stop stockade-test-postgres
```

Run frontend checks:

```bash
cd frontend
npm ci
npm run lint
npm run format:check
npm run build
```

Run all pre-commit hooks:

```bash
PRE_COMMIT_HOME=.pre-commit-cache .venv/bin/pre-commit run --all-files
```

Validate Compose:

```bash
STOCKADE_ENV_FILE=.env.example docker compose --env-file .env.example config
```

Run the isolated local acceptance verifier. It starts its own Compose project on
ports `18080` and `15173`, exercises login, product/customer/order/dashboard
flows, and removes its temporary database volume when done:

```bash
scripts/verify-local-stack.sh
```

## Docker Hub Publishing

This phase requires a Docker Hub account with permission to publish the target
repository. Create a public repository such as
`<namespace>/stockade-backend`, then set the repository overview in Docker Hub
to describe Stockade, the local Compose workflow, required environment
variables, and the image tags.

Automated publishing is available through the `Publish Backend Image` GitHub
Actions workflow. Configure these GitHub repository variables and secrets first:

| Name                 | Type                | Value                                                      |
| -------------------- | ------------------- | ---------------------------------------------------------- |
| `DOCKERHUB_USERNAME` | Repository variable | Docker Hub username or organization.                       |
| `DOCKERHUB_IMAGE`    | Repository variable | Full image name, for example `namespace/stockade-backend`. |
| `DOCKERHUB_TOKEN`    | Repository secret   | Docker Hub access token with push access.                  |

The workflow publishes on semantic version tags such as `v0.1.0`, and can also
be run manually with a version input. Both modes publish the version tag and
`latest`.

Publish backend tags:

```bash
: "${DOCKERHUB_NAMESPACE:?Set DOCKERHUB_NAMESPACE first}"
: "${IMAGE_VERSION:=0.1.0}"

docker build \
  -t "$DOCKERHUB_NAMESPACE/stockade-backend:$IMAGE_VERSION" \
  -t "$DOCKERHUB_NAMESPACE/stockade-backend:latest" \
  backend

docker push "$DOCKERHUB_NAMESPACE/stockade-backend:$IMAGE_VERSION"
docker push "$DOCKERHUB_NAMESPACE/stockade-backend:latest"
```

Verify:

```bash
: "${DOCKERHUB_NAMESPACE:?Set DOCKERHUB_NAMESPACE first}"
: "${IMAGE_VERSION:=0.1.0}"

docker pull "$DOCKERHUB_NAMESPACE/stockade-backend:$IMAGE_VERSION"
docker pull "$DOCKERHUB_NAMESPACE/stockade-backend:latest"
```

The image contains no application secrets. Runtime configuration is supplied by
environment variables.

Docker Hub overview copy is prepared in `docs/dockerhub-overview.md`.

## Hosted Backend Deployment

The recommended backend path is Render with a managed Render PostgreSQL
database. The deployment guide was written against the current Render docs for
Docker web services, Blueprints, environment variables, health checks, and
PostgreSQL wiring.

The repo includes `render.yaml` for a Render Blueprint. It defines a Docker web
service, a managed PostgreSQL database, the `/ready` health check, generated JWT
secret, and dashboard-provided values for deployment-specific secrets.

Required Render settings:

- Service type: Web Service
- Runtime: Docker
- Root directory: `backend`
- Blueprint file: `render.yaml`
- Health check path: `/ready`
- Bind host: `0.0.0.0`
- Port: set `BACKEND_PORT` to the platform web port, or let the platform set
  `PORT`
- Start command: use the Dockerfile default `./scripts/start.sh`

Required production environment variables:

```text
APP_NAME=Stockade API
ENVIRONMENT=production
LOG_LEVEL=INFO
BACKEND_HOST=0.0.0.0
DATABASE_URL=REPLACE_WITH_RENDER_POSTGRES_INTERNAL_DATABASE_URL
JWT_SECRET_KEY=REPLACE_WITH_NEW_SECRET_AT_LEAST_32_CHARACTERS
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
DEFAULT_ORGANIZATION_NAME=REPLACE_WITH_ORGANIZATION_NAME
ADMIN_EMAIL=REPLACE_WITH_ADMIN_EMAIL
ADMIN_PASSWORD=REPLACE_WITH_INITIAL_ADMIN_PASSWORD
CORS_ORIGINS=REPLACE_WITH_DEPLOYED_FRONTEND_ORIGIN
LOW_STOCK_THRESHOLD=5
```

The Blueprint marks `DEFAULT_ORGANIZATION_NAME`, `ADMIN_EMAIL`,
`ADMIN_PASSWORD`, and `CORS_ORIGINS` as unsynced values so they are entered in
Render and not stored in Git.

On first boot, `backend/scripts/start.sh` applies Alembic migrations and runs the
idempotent seed. Verify:

```bash
: "${STOCKADE_BACKEND_URL:?Set STOCKADE_BACKEND_URL first}"
curl -sS "$STOCKADE_BACKEND_URL/ready"
curl -sS "$STOCKADE_BACKEND_URL/docs"
```

Set a production-grade `ADMIN_PASSWORD` before first boot. The bootstrap process
is idempotent and does not overwrite an existing admin password on later boots.

## Hosted Frontend Deployment

The recommended frontend path is Vercel. The deployment guide was written
against the current Vercel docs for Vite projects and environment variables.

The repo includes `frontend/vercel.json` to route deep links back to
`index.html` for React Router.

Required Vercel settings:

- Framework preset: Vite
- Root directory: `frontend`
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`
- Production environment variable:
  `VITE_API_BASE_URL=https://backend.example.com`

Vite only exposes variables prefixed with `VITE_` to the browser bundle. The API
base URL is public configuration, not a secret.

After the frontend has a production URL, update the backend `CORS_ORIGINS` to
that exact origin and redeploy the backend. Keep CORS scoped to known frontend
origins only.

Verify live wiring:

```bash
STOCKADE_BACKEND_URL=https://backend.example.com \
  STOCKADE_FRONTEND_URL=https://frontend.example.com \
  STOCKADE_ADMIN_EMAIL=admin@example.com \
  STOCKADE_ADMIN_PASSWORD=replace-with-production-password \
  scripts/verify-live-deployment.sh
```

The live verifier opens frontend root and deep-link routes, checks backend
readiness, OpenAPI, CORS, login, product/customer creation, insufficient-stock
errors, order totals, stock decrement and restoration, order details, and
dashboard metrics. It creates timestamped verification records in the target
deployment.

## Submission Checklist

Fill this in after phases 19-21 are completed with real public artifacts. A
longer handoff checklist is available in `docs/submission.md`.

| Artifact                 | Value                        | Verified |
| ------------------------ | ---------------------------- | -------- |
| GitHub repository        | Pending remote URL           | Pending  |
| Docker Hub backend image | Pending Docker Hub namespace | Pending  |
| Live frontend URL        | Pending Vercel deployment    | Pending  |
| Live backend API URL     | Pending Render deployment    | Pending  |

Final acceptance requires all four artifacts to be public and verified, the full
test suite to pass, and the frontend/backend to communicate over the live URLs.

## Operational Notes

- Migrations are explicit Alembic migrations; the app does not auto-create
  tables from models.
- The backend image runs as a non-root user.
- The frontend image serves static assets from Nginx as the `nginx` user.
- Local Compose stores database data in a named volume.
- Free-tier hosted services can cold start; document that behavior for users if
  you choose free plans.
