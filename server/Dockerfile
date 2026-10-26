FROM ghcr.io/astral-sh/uv:0.9.26 AS uv
FROM python:3.12-slim
COPY --from=uv /uv /bin/uv
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy
COPY server/pyproject.toml server/uv.lock ./
RUN uv sync --frozen --no-dev
COPY server/app ./app
ENV PATH="/app/.venv/bin:$PATH"
EXPOSE 4000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "4000"]
