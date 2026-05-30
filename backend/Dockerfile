# syntax=docker/dockerfile:1

FROM python:3.14.5-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /build

COPY requirements.lock .
RUN python -m pip wheel --wheel-dir /wheels -r requirements.lock

FROM python:3.14.5-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

WORKDIR /app

RUN adduser --disabled-password --gecos "" --uid 10001 stockade

COPY requirements.lock .
COPY --from=builder /wheels /wheels
RUN python -m pip install --no-cache-dir --no-index --find-links=/wheels -r requirements.lock \
    && rm -rf /wheels

COPY alembic.ini .
COPY app ./app
COPY migrations ./migrations
COPY scripts ./scripts

RUN chmod +x scripts/start.sh

USER stockade

EXPOSE 8000

CMD ["./scripts/start.sh"]
