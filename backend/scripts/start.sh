#!/usr/bin/env sh
set -eu

alembic upgrade head
python -m app.bootstrap

APP_PORT="${BACKEND_PORT:-${PORT:-8000}}"

exec uvicorn \
  --factory app.main:create_app \
  --host "${BACKEND_HOST:-0.0.0.0}" \
  --port "${APP_PORT}"
