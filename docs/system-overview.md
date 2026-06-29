# System Overview

This is a full-stack CRM portfolio project with a Django/DRF backend, React frontend, PostgreSQL database, Redis services, Celery worker, and Docker-based development and production setups.

## Application Shape

- Frontend: React, TypeScript, Vite, and an FSD-lite source structure.
- Backend: Django 5.1, Django REST Framework, Simple JWT, Channels, and Celery.
- Data services: PostgreSQL for persistent data and Redis for Celery, cache/throttling, and Channels.
- Production entrypoint: Nginx serves the built frontend and proxies API, admin, WebSocket, static, and media traffic.

## Main Product Areas

- Users and roles: managers, workers, clients, and Django superusers.
- Companies: tenant boundary for normal CRM data.
- Teams: company-scoped worker groups.
- Projects: client work with assigned teams, status tracking, budgets, deadlines, and optional PDF blueprints.
- Worklogs: time entries for project work.
- Chats: project chat messages through REST, with a backend WebSocket consumer available.
- Finance: payments, salaries, transactions, Stripe checkout/webhook integration, and company summaries.
- Notifications: user-scoped unread/read notification flow.
- Reviews: client feedback on projects.

## Roles and Tenant Boundaries

`Company` is the main tenant boundary. Managers operate inside their company, workers see assigned or owned work, and clients see their own project and finance data. Django superusers can access broader data only where the backend view explicitly supports it.

`is_staff` alone is not treated as a CRM role.

## Frontend

- The frontend lives in `frontend/`.
- Network calls go through entity API modules and the shared API client.
- Production builds are static Vite assets served by Nginx.
- The frontend is configured with API, media, and WebSocket URLs through environment variables.
- Current chat UI uses the REST API. The backend WebSocket route exists, but browser clients are not currently wired to it because the middleware expects a bearer token in the `Authorization` header.

## Backend

- The API base path is `/api/`.
- Authentication uses JWT access and refresh tokens.
- The backend health endpoint is `/health/`.
- Production HTTP traffic runs through Gunicorn.
- Daphne serves Channels/WebSocket traffic at `ws/chat/<project_id>/`.
- Celery handles background notification-related work.

## Environments

### Development

- Copy `.env.example` to `.env`.
- Use `docker-compose.dev.yml`.
- Main ports: backend `8000`, Daphne `8001`, frontend `3000`, PostgreSQL `5432`.
- Development settings allow local CORS and disable DRF throttling.
- Local media is stored under `backend/media/`.

### Production-like Docker

- Copy `.env.prod.example` to `.env`.
- Use `docker-compose.prod.yml`.
- Nginx exposes `${APP_PORT:-8080}:80`.
- Production settings require explicit values for critical Django, Stripe, and storage configuration.
- HTTPS security flags are environment-driven so the stack can run locally over HTTP or behind an external TLS proxy.

## Storage

- Static files are collected into the production `static_data` Docker volume.
- `USE_S3_STORAGE=False` stores uploaded media in the production `media_data` Docker volume mounted at `/app/media`.
- `USE_S3_STORAGE=True` stores uploaded media in S3 through `django-storages`.
- Uploaded media, collected static files, logs, caches, and build outputs should not be committed.

## Tests and CI

- Backend tests run in Docker with the development and test Compose files.
- Frontend tests run with Vitest, and production frontend assets are validated with `npm run build`.
- GitHub Actions runs backend tests plus frontend tests and build on push and pull request.

## Operations

- Docker healthchecks cover PostgreSQL, Redis, backend, Daphne, frontend, Nginx, and Celery.
- `backend/entrypoint.sh` waits for PostgreSQL. For the backend service it also runs migrations and collects static files.
- Logs go to console by default. Production can also write log files when `DJANGO_LOG_DIR` is set.
