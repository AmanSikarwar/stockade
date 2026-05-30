#!/usr/bin/env sh
set -eu

PROJECT_NAME="${STOCKADE_VERIFY_PROJECT:-stockade_verify}"
BACKEND_PORT="${BACKEND_PORT:-18080}"
FRONTEND_PORT="${FRONTEND_PORT:-15173}"
ENV_FILE="$(mktemp "${TMPDIR:-/tmp}/stockade-verify-env.XXXXXX")"

cleanup() {
  if [ "${KEEP_STACK:-0}" != "1" ]; then
    STOCKADE_ENV_FILE="$ENV_FILE" docker compose --env-file "$ENV_FILE" -p "$PROJECT_NAME" down -v >/dev/null 2>&1 || true
  fi
  rm -f "$ENV_FILE"
}
trap cleanup EXIT INT TERM

cat >"$ENV_FILE" <<EOF
APP_NAME=Stockade API
ENVIRONMENT=local
LOG_LEVEL=INFO
POSTGRES_DB=stockade
POSTGRES_USER=stockade
POSTGRES_PASSWORD=local-dev-postgres-password
POSTGRES_PORT=5432
BACKEND_HOST=0.0.0.0
BACKEND_PORT=$BACKEND_PORT
DATABASE_URL=postgresql+psycopg://stockade:local-dev-postgres-password@db:5432/stockade
JWT_SECRET_KEY=local-dev-change-me-minimum-32-characters
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
DEFAULT_ORGANIZATION_NAME=Stockade Verify
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=local-dev-admin-password
CORS_ORIGINS=http://localhost:$FRONTEND_PORT,http://127.0.0.1:$FRONTEND_PORT
LOW_STOCK_THRESHOLD=5
FRONTEND_PORT=$FRONTEND_PORT
VITE_API_BASE_URL=http://localhost:$BACKEND_PORT
EOF

echo "[info] starting isolated Compose project $PROJECT_NAME"
STOCKADE_ENV_FILE="$ENV_FILE" docker compose --env-file "$ENV_FILE" -p "$PROJECT_NAME" up --build -d --wait

echo "[info] verifying local stack"
STOCKADE_BACKEND_URL="http://127.0.0.1:$BACKEND_PORT" \
  STOCKADE_FRONTEND_URL="http://127.0.0.1:$FRONTEND_PORT" \
  STOCKADE_ADMIN_EMAIL=admin@example.com \
  STOCKADE_ADMIN_PASSWORD=local-dev-admin-password \
  "${0%/*}/verify-live-deployment.sh"

echo "[ok] local stack verification completed"
