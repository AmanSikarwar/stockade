# Stockade Submission Package

Use this file as the final handoff checklist after Docker Hub, backend hosting,
and frontend hosting are complete.

## Public Artifacts

| Artifact                 | URL | Verification                                       |
| ------------------------ | --- | -------------------------------------------------- |
| GitHub repository        |     | Public and current branch pushed.                  |
| Docker Hub backend image |     | `docker pull` works for version and `latest` tags. |
| Live backend API         |     | `/ready` returns ready and `/docs` loads.          |
| Live frontend            |     | Login and app flows work against live backend.     |

## Required Live Verification

Run the live verifier against the public deployment:

```bash
STOCKADE_BACKEND_URL=https://backend.example.com \
  STOCKADE_FRONTEND_URL=https://frontend.example.com \
  STOCKADE_ADMIN_EMAIL=admin@example.com \
  STOCKADE_ADMIN_PASSWORD=replace-with-production-password \
  scripts/verify-live-deployment.sh
```

The script creates timestamped verification records in the target deployment and
checks:

1. Open the frontend URL.
2. Log in with the seeded admin credentials.
3. Create a product with stock.
4. Create a customer.
5. Create a multi-line order and confirm stock decrements.
6. Attempt an over-stock order and confirm a specific insufficient-stock error.
7. Cancel an order and confirm stock restores.
8. Open order detail and verify unit-price snapshots.
9. Open dashboard and verify totals and low-stock metrics.
10. Confirm backend `/ready` returns ready.
11. Confirm backend `/docs` reflects the live schema.

## Local Verification Before Submission

```bash
STOCKADE_ENV_FILE=.env.example docker compose --env-file .env.example config
PRE_COMMIT_HOME=.pre-commit-cache .venv/bin/pre-commit run --all-files
npm --prefix frontend run build
scripts/verify-local-stack.sh
```

Run the backend suite against a disposable PostgreSQL database:

```bash
docker run --rm -d --name stockade-test-postgres \
  -e POSTGRES_DB=stockade_test \
  -e POSTGRES_USER=stockade \
  -e POSTGRES_PASSWORD=local-dev-postgres-password \
  -p 55433:5432 \
  postgres:18.4-alpine3.23

until docker exec stockade-test-postgres pg_isready -U stockade -d stockade_test; do sleep 1; done

cd backend
TEST_DATABASE_URL=postgresql+psycopg://stockade:local-dev-postgres-password@localhost:55433/stockade_test \
  ../.venv/bin/python -m pytest tests

cd ..
docker stop stockade-test-postgres
```

## Notes To Fill At Submission

- Docker Hub image tags:
- Backend host:
- Frontend host:
- Production `CORS_ORIGINS`:
- Known limitations:
