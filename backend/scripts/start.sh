#!/usr/bin/env sh
set -eu

alembic upgrade head
python -m app.bootstrap

exec uvicorn \
  --factory app.main:create_app \
  --host "${BACKEND_HOST:-0.0.0.0}" \
  --port "${BACKEND_PORT:-8000}"
