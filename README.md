# Stockade

Stockade is a self-hostable inventory and order management application for
small operations teams. It combines a FastAPI backend, PostgreSQL data model,
Alembic migrations, and a React/Vite frontend for managing products,
categories, customers, orders, inventory adjustments, dashboard metrics, and
sales reports.

## Live Project

| Artifact                 | URL                                                                                                        |
| ------------------------ | ---------------------------------------------------------------------------------------------------------- |
| GitHub repository        | [github.com/AmanSikarwar/stockade](https://github.com/AmanSikarwar/stockade)                               |
| Live app                 | [stockade-delta.vercel.app/app](https://stockade-delta.vercel.app/app)                                     |
| Deployed backend         | [stockade-backend-production.up.railway.app](https://stockade-backend-production.up.railway.app/)          |
| Backend OpenAPI docs     | [stockade-backend-production.up.railway.app/docs](https://stockade-backend-production.up.railway.app/docs) |
| Docker Hub backend image | [amansikarwar/stockade-backend](https://hub.docker.com/r/amansikarwar/stockade-backend)                    |

Demo login:

```text
Email: admin@stockade.app
Password: StockadePass
```

Use the demo credentials only for the hosted demo. Private deployments should
set their own `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `JWT_SECRET_KEY` before the
first backend boot.

## What Stockade Does

- Tracks products with SKU, price, on-hand quantity, optional category, optional
  reorder point, and active/inactive state.
- Groups products into categories and exposes product counts per category.
- Manages customers with validated email addresses and optional phone numbers.
- Creates multi-line orders against customers and products.
- Computes order totals server-side using exact decimal money values.
- Snapshots product price into each order line so historical orders are stable.
- Rejects orders that would oversell inventory.
- Decrements stock in the same transaction as order creation.
- Cancels orders and restores stock in the same transaction.
- Records every inventory change in an append-only stock movement audit log.
- Supports manual stock adjustments for restocks, corrections, damage, and
  general manual changes.
- Shows dashboard totals, order status counts, and low-stock products.
- Reports revenue over time, top products, and sales by customer.
- Protects business endpoints with signed JWT bearer authentication.

## Repository Layout

```text
.
|-- backend/                  # FastAPI API, SQLAlchemy models, Alembic, tests
|   |-- app/
|   |   |-- api/              # Route handlers and API dependencies
|   |   |-- core/             # Settings, logging, JWT/password security
|   |   |-- db/               # SQLAlchemy base/session wiring
|   |   |-- models/           # SQLAlchemy ORM entities
|   |   |-- repositories/     # Organization-scoped persistence queries
|   |   |-- schemas/          # Pydantic request/response models
|   |   `-- services/         # Business rules and transactions
|   |-- migrations/           # Alembic migration environment and versions
|   |-- tests/                # Backend pytest suite
|   |-- Dockerfile
|   `-- railway.json
|-- frontend/                 # React/Vite app and production Nginx image
|   |-- src/
|   |   |-- api/              # Fetch client and TanStack Query hooks
|   |   |-- auth/             # Session persistence and auth context
|   |   |-- components/       # Reusable shell, UI, feedback, and brand pieces
|   |   |-- pages/            # Dashboard, products, categories, orders, reports
|   |   |-- styles/
|   |   `-- theme/
|   |-- Dockerfile
|   `-- vercel.json
|-- docs/                     # Docker Hub overview copy and project notes
|-- scripts/                  # Local and live deployment verification scripts
|-- compose.yaml              # Local full-stack Docker Compose stack
|-- render.yaml               # Alternative Render blueprint for backend hosting
`-- .github/workflows/        # CI and Docker Hub publishing workflows
```

## Architecture

Stockade is organized as a small monorepo with separate backend and frontend
applications.

The backend keeps route handlers thin. Routes validate HTTP inputs and map
domain exceptions to structured API errors. Business behavior lives in service
classes, and persistence details live in repositories. Models are
organization-scoped from the start, so the current single-organization bootstrap
can evolve toward broader multi-tenancy without changing every table.

The frontend uses React Router for page routing, TanStack Query for server
state, and a shared API client that attaches bearer tokens from the auth
context. The app shell protects `/app/*` routes, while `/login` remains public.
The production frontend build is static and is served by Nginx in Docker or by
Vercel in the hosted deployment.

Request flow:

```text
Browser
  -> React page / TanStack Query hook
  -> frontend/src/api/client.js
  -> FastAPI route
  -> service transaction
  -> repository query
  -> PostgreSQL
```

## Quick Start With Docker Compose

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
- Backend readiness: `http://localhost:8000/ready`
- Backend liveness: `http://localhost:8000/health`
- API docs: `http://localhost:8000/docs`

Local seeded admin:

```text
Email: admin@example.com
Password: local-dev-admin-password
```

Stop the stack:

```bash
docker compose --env-file .env down
```

Stop the stack and remove the local database volume:

```bash
docker compose --env-file .env down -v
```

## Local Development Without Compose

Compose is the shortest path because it wires PostgreSQL, the backend, and the
frontend together. For split-process development, run PostgreSQL separately and
start each app from its own directory.

Start PostgreSQL:

```bash
docker run --rm -d --name stockade-postgres \
  -e POSTGRES_DB=stockade \
  -e POSTGRES_USER=stockade \
  -e POSTGRES_PASSWORD=local-dev-postgres-password \
  -p 5432:5432 \
  postgres:18.4-alpine3.23
```

Start the backend:

```bash
cd backend
cp .env.example .env
python3.14 -m venv .venv
. .venv/bin/activate
python -m pip install -r requirements-dev.txt
alembic upgrade head
python -m app.bootstrap
uvicorn --factory app.main:create_app --host 127.0.0.1 --port 8000 --reload
```

Start the frontend in another shell:

```bash
cd frontend
cp .env.example .env.local
npm ci
npm run dev
```

The Vite dev server runs at `http://127.0.0.1:5173` and reads
`VITE_API_BASE_URL` from `frontend/.env.local`.

## Environment Variables

Root `.env.example` is used by Docker Compose. `backend/.env.example` is useful
when running the backend from the `backend/` directory. `frontend/.env.example`
contains the Vite public API URL.

| Variable                      | Required                | Used by          | Description                                                                                             |
| ----------------------------- | ----------------------- | ---------------- | ------------------------------------------------------------------------------------------------------- |
| `APP_NAME`                    | No                      | Backend          | Display name for generated docs and logs.                                                               |
| `ENVIRONMENT`                 | No                      | Backend          | One of `local`, `test`, `staging`, `production`.                                                        |
| `LOG_LEVEL`                   | No                      | Backend          | Logging level: `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`.                                         |
| `POSTGRES_DB`                 | Yes for Compose         | Compose DB       | Local PostgreSQL database name.                                                                         |
| `POSTGRES_USER`               | Yes for Compose         | Compose DB       | Local PostgreSQL username.                                                                              |
| `POSTGRES_PASSWORD`           | Yes for Compose         | Compose DB       | Local PostgreSQL password.                                                                              |
| `POSTGRES_PORT`               | No                      | Local convention | Host port used for local PostgreSQL references.                                                         |
| `BACKEND_HOST`                | No                      | Backend          | Bind host, usually `0.0.0.0` in containers.                                                             |
| `BACKEND_PORT`                | No                      | Backend/Compose  | Backend bind and published port.                                                                        |
| `PORT`                        | Platform-provided       | Hosted backend   | Used by `backend/scripts/start.sh` if `BACKEND_PORT` is unset.                                          |
| `DATABASE_URL`                | Yes                     | Backend          | SQLAlchemy PostgreSQL URL. `postgres://` and `postgresql://` are normalized to `postgresql+psycopg://`. |
| `JWT_SECRET_KEY`              | Yes                     | Backend          | JWT signing secret; must be at least 32 characters.                                                     |
| `JWT_ALGORITHM`               | No                      | Backend          | JWT algorithm, default `HS256`.                                                                         |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No                      | Backend          | Access token lifetime in minutes.                                                                       |
| `DEFAULT_ORGANIZATION_NAME`   | Yes                     | Bootstrap        | Name for the seeded organization.                                                                       |
| `ADMIN_EMAIL`                 | Yes                     | Bootstrap/Auth   | Initial admin email.                                                                                    |
| `ADMIN_PASSWORD`              | Yes                     | Bootstrap/Auth   | Initial admin password; minimum 12 characters.                                                          |
| `CORS_ORIGINS`                | Yes for browser clients | Backend          | Comma-separated frontend origins allowed by CORS.                                                       |
| `LOW_STOCK_THRESHOLD`         | No                      | Dashboard        | Fallback threshold when a product has no `reorder_point`.                                               |
| `FRONTEND_PORT`               | No                      | Compose frontend | Local host port for the containerized frontend.                                                         |
| `VITE_API_BASE_URL`           | Yes                     | Frontend build   | Public backend API base URL included in the browser bundle.                                             |

Never reuse local example secrets in production.

## Backend Startup Behavior

The backend container default command is `backend/scripts/start.sh`. On every
startup it runs:

1. `alembic upgrade head`
2. `python -m app.bootstrap`
3. `uvicorn --factory app.main:create_app`

The bootstrap is idempotent:

- It creates the default organization only when no organization exists.
- It creates the configured admin user only when missing.
- It does not overwrite an existing admin password on later boots.

## Data Model

`organizations`

- Own users, products, categories, customers, and orders.
- A default organization is seeded on first boot.

`users`

- Belong to an organization.
- Store email, role, timestamps, and an Argon2 password hash.
- Supported roles are `admin` and `staff`; current UI seeds and uses an admin.

`categories`

- Belong to an organization.
- Have a name unique within that organization.
- Include product counts in API responses.
- Can be deleted without deleting products; product `category_id` becomes
  `NULL`.

`products`

- Belong to an organization.
- Optionally reference a category.
- Store name, SKU, decimal price, non-negative stock quantity, optional
  reorder point, active flag, and timestamps.
- Enforce unique `(organization_id, sku)`.
- Delete operations mark products inactive so historical orders remain valid.

`stock_movements`

- Belong to an organization and product.
- Append-only audit trail for every stock quantity change.
- Store signed `delta`, `resulting_quantity`, reason, optional note, optional
  referenced order, optional acting user, and timestamp.
- Supported reasons are `order`, `cancellation`, `manual`, `correction`,
  `restock`, and `damage`.

`customers`

- Belong to an organization.
- Store full name, validated email, optional phone number, and timestamps.
- Enforce unique `(organization_id, email)`.
- Cannot be deleted after they have orders.

`orders`

- Belong to an organization and customer.
- Store status, server-computed total amount, and timestamps.
- Supported statuses are `active` and `cancelled`.

`order_line_items`

- Belong to an order and reference a product.
- Store ordered quantity, unit-price snapshot, and line total.

## Business Rules

- Product SKUs are normalized to uppercase.
- Customer emails are normalized to lowercase.
- Product prices can have at most two decimal places.
- Product quantity and reorder point cannot be negative.
- Order line quantities must be positive.
- Order totals and line totals are computed by the backend, not trusted from the
  client.
- Order creation validates the customer, all products, and available stock
  before committing any write.
- Order creation decrements stock and records `order` stock movements in the
  same database transaction.
- Cancelling an order is idempotent for already-cancelled orders.
- Cancelling an active order restores stock and records `cancellation` stock
  movements in the same database transaction.
- Manual stock adjustments reject zero deltas and any adjustment that would make
  stock negative.
- Low-stock evaluation uses the product `reorder_point` when present, otherwise
  it uses `LOW_STOCK_THRESHOLD`.
- Reports aggregate active orders only, so cancelled orders do not contribute to
  revenue or rankings.
- List endpoints are paginated and sort only by allow-listed fields.
- API errors use a stable shape: `{"detail":{"code":"...","message":"..."}}`.

## API Reference

Interactive OpenAPI docs are available at `/docs`; raw OpenAPI JSON is
available at `/openapi.json`.

All business endpoints require:

```http
Authorization: Bearer <access_token>
```

Authentication and health:

| Method | Path            | Description                                                 |
| ------ | --------------- | ----------------------------------------------------------- |
| `GET`  | `/health`       | Liveness check.                                             |
| `GET`  | `/ready`        | Readiness check.                                            |
| `POST` | `/auth/login`   | Body: `email`, `password`. Returns bearer token and expiry. |
| `POST` | `/auth/refresh` | Issues a fresh token for the current bearer token.          |
| `GET`  | `/auth/me`      | Returns the authenticated user.                             |

Products:

| Method   | Path                                     | Description                                                                                                          |
| -------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `POST`   | `/products`                              | Create product. Body: `name`, `sku`, `price`, `quantity_in_stock`, optional `category_id`, optional `reorder_point`. |
| `GET`    | `/products`                              | List products. Query: `limit`, `offset`, `q`, `include_inactive`, `sort_by`, `sort_dir`, `category_id`.              |
| `GET`    | `/products/{product_id}`                 | Get one active product.                                                                                              |
| `PUT`    | `/products/{product_id}`                 | Partial update for product fields.                                                                                   |
| `DELETE` | `/products/{product_id}`                 | Mark product inactive.                                                                                               |
| `POST`   | `/products/{product_id}/adjust-stock`    | Apply signed stock delta. Body: `delta`, `reason`, optional `note`.                                                  |
| `GET`    | `/products/{product_id}/stock-movements` | List stock audit records. Query: `limit`, `offset`.                                                                  |

Categories:

| Method   | Path                        | Description                                                         |
| -------- | --------------------------- | ------------------------------------------------------------------- |
| `POST`   | `/categories`               | Create category. Body: `name`.                                      |
| `GET`    | `/categories`               | List categories with product counts. Query: `limit`, `offset`, `q`. |
| `GET`    | `/categories/{category_id}` | Get one category.                                                   |
| `PUT`    | `/categories/{category_id}` | Rename category.                                                    |
| `DELETE` | `/categories/{category_id}` | Delete category; products become uncategorized.                     |

Customers:

| Method   | Path                       | Description                                                           |
| -------- | -------------------------- | --------------------------------------------------------------------- |
| `POST`   | `/customers`               | Create customer. Body: `full_name`, `email`, optional `phone_number`. |
| `GET`    | `/customers`               | List customers. Query: `limit`, `offset`, `q`, `sort_by`, `sort_dir`. |
| `GET`    | `/customers/{customer_id}` | Get one customer.                                                     |
| `PUT`    | `/customers/{customer_id}` | Partial update for customer fields.                                   |
| `DELETE` | `/customers/{customer_id}` | Delete customer if they have no orders.                               |

Orders:

| Method   | Path                 | Description                                                                                 |
| -------- | -------------------- | ------------------------------------------------------------------------------------------- |
| `POST`   | `/orders`            | Create order. Body: `customer_id`, `line_items: [{product_id, quantity}]`.                  |
| `GET`    | `/orders`            | List orders. Query: `limit`, `offset`, `q`, `status`, `customer_id`, `sort_by`, `sort_dir`. |
| `GET`    | `/orders/{order_id}` | Get order with line items.                                                                  |
| `DELETE` | `/orders/{order_id}` | Cancel order and restore stock.                                                             |

Dashboard and reports:

| Method | Path                         | Description                                                                 |
| ------ | ---------------------------- | --------------------------------------------------------------------------- |
| `GET`  | `/dashboard`                 | Product/customer/order totals and low-stock list. Query: `low_stock_limit`. |
| `GET`  | `/reports/revenue-over-time` | Daily revenue and order counts. Query: `days` from 1 to 365.                |
| `GET`  | `/reports/top-products`      | Best-selling products by revenue. Query: `limit` from 1 to 50.              |
| `GET`  | `/reports/sales-by-customer` | Revenue and order counts by customer. Query: `limit` from 1 to 50.          |

## API Example

Login and call the local API:

```bash
TOKEN=$(curl -sS http://localhost:8000/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@example.com","password":"local-dev-admin-password"}' \
  | python -c 'import json,sys; print(json.load(sys.stdin)["access_token"])')

curl -sS http://localhost:8000/dashboard \
  -H "Authorization: Bearer $TOKEN"
```

Create a product, customer, and order:

```bash
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
```

## Frontend Routes

| Route                  | Purpose                                                                                            |
| ---------------------- | -------------------------------------------------------------------------------------------------- |
| `/`                    | Redirects to `/app` when authenticated or `/login` otherwise.                                      |
| `/login`               | Public login page.                                                                                 |
| `/app`                 | Dashboard with metrics, low-stock alerts, and recent orders.                                       |
| `/app/products`        | Catalog table, filters, create/edit product form, stock adjustment drawer, stock movement history. |
| `/app/categories`      | Category search, create/edit/delete, and product counts.                                           |
| `/app/orders`          | Order list, status tabs, sorting, and order builder.                                               |
| `/app/orders/:orderId` | Order detail with line items and cancellation action.                                              |
| `/app/customers`       | Customer search, pagination, create/edit/delete.                                                   |
| `/app/reports`         | Revenue chart, low-stock report, top products, and sales by customer.                              |

## Testing And Quality Checks

Backend tests require PostgreSQL. One local pattern is to run a disposable test
database:

```bash
docker run --rm -d --name stockade-test-postgres \
  -e POSTGRES_DB=stockade_test \
  -e POSTGRES_USER=stockade \
  -e POSTGRES_PASSWORD=local-dev-postgres-password \
  -p 55433:5432 \
  postgres:18.4-alpine3.23

until docker exec stockade-test-postgres pg_isready -U stockade -d stockade_test; do sleep 1; done

python3.14 -m venv .venv
. .venv/bin/activate
python -m pip install -r backend/requirements-dev.txt

TEST_DATABASE_URL=postgresql+psycopg://stockade:local-dev-postgres-password@localhost:55433/stockade_test \
  python -m pytest backend/tests

docker stop stockade-test-postgres
```

Frontend checks:

```bash
cd frontend
npm ci
npm run lint
npm run format:check
npm run test
npm run build
```

Pre-commit hooks:

```bash
PRE_COMMIT_HOME=.pre-commit-cache .venv/bin/pre-commit run --all-files
```

Validate Compose configuration:

```bash
STOCKADE_ENV_FILE=.env.example docker compose --env-file .env.example config
```

## Verification Scripts

Run an isolated full-stack local acceptance check:

```bash
scripts/verify-local-stack.sh
```

The script creates a temporary env file, starts an isolated Compose project on
ports `18080` and `15173`, verifies the frontend and backend, exercises core
flows, and removes the temporary database volume unless `KEEP_STACK=1` is set.

Verify a deployed environment:

```bash
STOCKADE_BACKEND_URL=https://stockade-backend-production.up.railway.app \
  STOCKADE_FRONTEND_URL=https://stockade-delta.vercel.app \
  STOCKADE_ADMIN_EMAIL=admin@stockade.app \
  STOCKADE_ADMIN_PASSWORD=StockadePass \
  scripts/verify-live-deployment.sh
```

The live verifier checks frontend root and deep links, backend readiness,
OpenAPI paths, CORS, login, product/customer creation, insufficient-stock
errors, order totals, stock decrement and restoration, cancellation, order
detail, and dashboard metrics. It creates timestamped verification records in
the target environment.

## Docker Images

Build the backend image locally:

```bash
docker build -t stockade-backend:local backend
```

Pull the published backend image:

```bash
docker pull amansikarwar/stockade-backend:latest
```

Run it with a PostgreSQL database and production-grade variables:

```bash
docker run --rm -p 8000:8000 \
  -e DATABASE_URL='postgresql+psycopg://user:password@host:5432/stockade' \
  -e JWT_SECRET_KEY='replace-with-at-least-32-characters' \
  -e DEFAULT_ORGANIZATION_NAME='Stockade' \
  -e ADMIN_EMAIL='admin@example.com' \
  -e ADMIN_PASSWORD='replace-with-strong-password' \
  -e CORS_ORIGINS='https://your-frontend.example.com' \
  amansikarwar/stockade-backend:latest
```

The backend image:

- Runs as a non-root `stockade` user.
- Contains Alembic migrations and the bootstrap command.
- Does not contain application secrets.
- Uses the platform `PORT` environment variable when `BACKEND_PORT` is unset.

Build the frontend image locally:

```bash
docker build \
  --build-arg VITE_API_BASE_URL=http://localhost:8000 \
  -t stockade-frontend:local \
  frontend
```

## Docker Hub Publishing

Automated backend image publishing is configured in
`.github/workflows/publish-backend-image.yml`.

Required GitHub repository configuration:

| Name                 | Type                | Description                                                   |
| -------------------- | ------------------- | ------------------------------------------------------------- |
| `DOCKERHUB_USERNAME` | Repository variable | Docker Hub username or organization.                          |
| `DOCKERHUB_IMAGE`    | Repository variable | Full image name, for example `amansikarwar/stockade-backend`. |
| `DOCKERHUB_TOKEN`    | Repository secret   | Docker Hub access token with push access.                     |

The workflow publishes on semantic version tags such as `v0.1.0`, and can also
be run manually with a version input. Both modes publish the version tag and
`latest`.

Manual publish example:

```bash
IMAGE=amansikarwar/stockade-backend
VERSION=0.1.0

docker build -t "$IMAGE:$VERSION" -t "$IMAGE:latest" backend
docker push "$IMAGE:$VERSION"
docker push "$IMAGE:latest"
```

Docker Hub overview copy lives in `docs/dockerhub-overview.md`.

## Backend Deployment

### Railway

The live backend is hosted on Railway:

```text
https://stockade-backend-production.up.railway.app/
```

The repo includes `backend/railway.json`:

- Builder: Dockerfile
- Dockerfile path: `Dockerfile`
- Health check path: `/ready`
- Health check timeout: `300`

Recommended Railway setup:

- Service type: GitHub repository service
- Root directory: `/backend`
- Config file: `/backend/railway.json`
- Start command: leave empty so the Dockerfile command runs
- Do not set `BACKEND_PORT`; Railway injects `PORT`
- Add a Railway PostgreSQL service and point `DATABASE_URL` at it

Required production variables:

```text
APP_NAME=Stockade API
ENVIRONMENT=production
LOG_LEVEL=INFO
BACKEND_HOST=0.0.0.0
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET_KEY=replace-with-new-secret-at-least-32-characters
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
DEFAULT_ORGANIZATION_NAME=Stockade
ADMIN_EMAIL=replace-with-admin-email
ADMIN_PASSWORD=replace-with-initial-admin-password
CORS_ORIGINS=https://stockade-delta.vercel.app
LOW_STOCK_THRESHOLD=5
```

Verify after deployment:

```bash
curl -sS https://stockade-backend-production.up.railway.app/ready
curl -sS https://stockade-backend-production.up.railway.app/docs
```

## Frontend Deployment

The live frontend is hosted on Vercel:

```text
https://stockade-delta.vercel.app/app
```

`frontend/vercel.json` rewrites all routes to `index.html`, allowing React
Router deep links such as `/app/orders/:orderId` to load directly.

Recommended Vercel setup:

- Framework preset: Vite
- Root directory: `frontend`
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`
- Production environment variable:
  `VITE_API_BASE_URL=https://stockade-backend-production.up.railway.app`

After assigning or changing the frontend domain, update backend `CORS_ORIGINS`
to the exact frontend origin and redeploy the backend.

## CI

`.github/workflows/ci.yml` runs on push, pull request, and manual dispatch.

Backend job:

- Starts PostgreSQL `18.4-alpine3.23`.
- Installs `backend/requirements-dev.txt`.
- Runs `python -m pytest tests` from `backend/`.

Frontend job:

- Installs Node dependencies with `npm --prefix frontend ci`.
- Runs ESLint.
- Runs Prettier format check.
- Runs Vitest.
- Builds the Vite app.

## Operational Notes

- Migrations are explicit Alembic migrations; the app does not auto-create
  tables from models at runtime.
- Free-tier hosted services may cold start.
- The backend CORS allow-list should contain only known frontend origins.
- The frontend API base URL is public build-time configuration, not a secret.
- The backend image and frontend image run as non-root users.
- Local Compose persists PostgreSQL data in the `stockade_postgres_data` named
  volume.
- The live verification script mutates target data by creating timestamped test
  records; use it intentionally against production-like environments.
