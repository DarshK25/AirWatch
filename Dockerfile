# Multi-stage Dockerfile for a single Render web service.
# Builds the Vite frontend, then serves both frontend and FastAPI from Python.

FROM node:18-alpine AS frontend-build

WORKDIR /frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ .
ENV VITE_API_BASE_URL=/api/v1
RUN npm run build

FROM python:3.10-slim AS app

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY fastapi_app/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY fastapi_app/ ./
COPY --from=frontend-build /frontend/dist ./static

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
