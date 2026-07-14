# PABOS Enterprise

**Praeto AI Brokerage Operating System**

This is the engineering home for PABOS Enterprise — an AI-powered insurance brokerage operating system being built for Praeto Risk & Insurance Management Solutions, with a long-term goal of supporting multiple brokerages through a configurable multi-tenant architecture.

## What PABOS is

A single operational platform that combines:

- Client Relationship Management (CRM)
- Policy Administration
- Claims Management
- Workflow Automation
- AI Decision Support
- Compliance Management
- Knowledge Management
- Document Management
- Staff Training
- Executive Intelligence & Analytics

## Status

- SRS v1.0: drafted
- SAS v1.0: drafted
- Code skeleton: **MVP wired** (IAM, CRM, policy admin, AI intake MVP)
- Local dev stack: running on Windows with portable PostgreSQL (Docker unavailable on this machine)
- Infrastructure: Docker Compose dev environment ready for machines that support it
- CI/CD: GitHub Actions workflow created

## Project structure

```
Praeto Office AI Portal/
├── README.md                 # This file
├── AGENTS.md                 # Rules for AI assistants
├── docs/
│   ├── PABOS-SRS-v1.0.md     # Software Requirements Specification
│   ├── BACKLOG.md            # Prioritised delivery backlog
│   └── (future) PABOS-SAS.md # System Architecture Specification
├── backend/                  # NestJS API + Prisma
├── frontend/                 # React + Vite SPA
├── infra/                    # Docker Compose, Nginx, Ollama helpers
├── .github/workflows/        # CI/CD
└── docs/                     # SRS, SAS, backlog, runbooks
```

## How to work on this project

1. Read `AGENTS.md` first.
2. Read the current SRS before proposing any code or architecture.
3. Work from the backlog; do not start unplanned modules.
4. Keep all secrets, credentials, and client data out of this folder.
5. POPIA, FAIS, and FICA are first-class constraints, not afterthoughts.

## Developer setup

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Start infrastructure services

If you have Docker, copy the env files and use Docker Compose:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm run infra:up
```

On the current Windows machine Docker is unavailable, so we use a portable PostgreSQL instance instead. See [`docs/LOCAL_DEV.md`](docs/LOCAL_DEV.md) for the exact steps.

### 3. Run database migrations and seed

```bash
npm run db:migrate
npm run db:seed
```

The seed creates a demo organisation, a `Durban` branch, and an admin user:

- Email: `admin@praeto.local`
- Password: `Admin1234!`

### 4. (Optional) Pull a local LLM

```bash
npm run ollama:pull
```

This downloads `llama3.2` into the Ollama container. See `docs/LOCAL_AI.md` for CPU/GPU notes.

### 5. Start the apps

```bash
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- API via Nginx (Docker only): http://localhost

### 6. Run verification

```bash
npm run lint
npm run test
npm run build
```

## Seeded demo data

- Organisation: **Praeto Demo**
- Branch: **Durban**
- Activity codes: `NEW_POLICY_MOTOR`, `ENDORSEMENT_ADDRESS_CHANGE`, `CLAIM_REGISTER`

## Next deliverable

First end-to-end user flow:

1. Login (MFA optional).
2. Create a client.
3. Create a motor policy.
4. Submit an address-change endorsement.
5. Use the AI intake page to analyse a sample client message.

The first three steps are verified by the E2E smoke test (`e2e_smoke.py`). The address-change form still needs to be aligned with the backend's structured address fields before it is fully end-to-end.

