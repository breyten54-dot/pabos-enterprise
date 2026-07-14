# Local Development Guide (Windows, no Docker)

This guide covers the current development setup on the Windows machine where Docker is not available. It uses a portable PostgreSQL 16 instance and runs the backend and frontend directly with Node.

## What's running and where

| Service | URL / port | Notes |
|---------|------------|-------|
| React frontend | http://localhost:5173 | Vite dev server |
| NestJS backend | http://localhost:4000 | API prefix `/api/v1` |
| API docs (Swagger) | http://localhost:4000/api/docs | |
| Portable PostgreSQL | localhost:5433 | Data in `.postgres/data/` |

`localhost:3000` is already occupied on this machine, so the backend runs on port `4000`. `localhost:5432` is occupied by another PostgreSQL instance, so the portable database runs on port `5433`.

## One-time setup

1. Install dependencies:
   ```bash
   npm run install:all
   ```

2. Copy environment templates:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

3. Start the portable PostgreSQL instance:
   ```bash
   bash .postgres/start-postgres.sh
   ```

4. Run migrations and seed the demo data:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

   The seed creates:
   - Organisation: **Praeto Demo**
   - Branch: **Durban**
   - Admin user: `admin@praeto.local` / `Admin1234!`
   - Activity codes: `NEW_POLICY_MOTOR`, `ENDORSEMENT_ADDRESS_CHANGE`, `CLAIM_REGISTER`

## Daily development

1. Make sure PostgreSQL is running:
   ```bash
   bash .postgres/start-postgres.sh
   ```

2. Start both apps:
   ```bash
   npm run dev
   ```

   Or start them separately:
   ```bash
   npm run dev:backend
   npm run dev:frontend
   ```

3. Open http://localhost:5173 and log in with the seeded admin credentials.

## Verification

```bash
npm run lint
npm run test
npm run build
```

There is also a headless E2E smoke test that exercises login → create client → create policy:

```bash
bash .postgres/start-postgres.sh
npm run dev:backend
npm run dev:frontend
# In another terminal:
.venv-webtest/Scripts/python e2e_smoke.py
```

## Stopping PostgreSQL

```bash
bash .postgres/stop-postgres.sh
```

## What's intentionally disabled locally

- **Redis / BullMQ notifications queue**: set `NOTIFICATIONS_QUEUE_ENABLED=false` in `backend/.env` because Redis is not running without Docker. The notifications controller is not loaded when the queue is disabled.
- **MinIO**: document upload/download stubs are present but MinIO is not running.
- **Ollama**: not installed locally. `POST /api/v1/ai/intake` falls back to a structured mock response.

## Troubleshooting

- `EADDRINUSE: address already in use :::4000` — another backend process is running. Find and kill it, or use a different `PORT` in `backend/.env`.
- `Can't reach database server at localhost:5433` — PostgreSQL is not running. Start it with `.postgres/start-postgres.sh`.
- Frontend login stays on `/login` with a CORS error — backend CORS is enabled in `main.ts`, so this usually means the backend dev server has not picked up the latest code. Restart it.
