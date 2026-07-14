# PABOS Enterprise Backend

NestJS 10 modular monolith for the Praeto AI Brokerage Operating System.

## Tech stack

- NestJS 10 + TypeScript
- Prisma 5 + PostgreSQL 16
- Redis 7 + BullMQ (queue stubs in place)
- Argon2 passwords, JWT + rotating refresh tokens, TOTP MFA
- RBAC with `@RequirePermission` guard
- MinIO stubs for document storage
- Local Ollama integration stub for AI intake

## Project structure

```
src/
  config/          # Env validation
  prisma/          # Prisma service (global module)
  audit/           # Central audit log service (global module)
  iam/             # Auth, MFA, RBAC
  crm/             # Clients, contacts, consent
  policy-admin/    # Policies and endorsements
  documents/       # MinIO upload/download stubs
  notifications/   # Email/SMS queue stubs
  workflow-engine/ # Activity codes and tasks
  ai-copilot/      # AI intake with PII masking
  knowledge-base/  # Article CRUD and embedding stubs
```

## Quick start

1. Copy `.env.example` to `.env` and fill in values.
2. Start PostgreSQL. If Docker is unavailable, use the portable Postgres in `.postgres/` (see `docs/LOCAL_DEV.md`). Redis is optional; set `NOTIFICATIONS_QUEUE_ENABLED=false` if it is not running.
3. Run migrations and seed:
   ```bash
   npx prisma migrate dev
   npx prisma db seed
   ```
4. Start the server:
   ```bash
   npm run start:dev
   ```
5. Login with seeded admin:
   - `admin@praeto.local` / `Admin1234!`

## Verification

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run build
npm run test
```

## Notes

- CORS is enabled for local development (port 5173 by default).
- AI intake masks RSA IDs, phone numbers, emails, registration numbers, and addresses before calling Ollama.
- All writes to sensitive entities are logged via the central `AuditService`.
- Real secrets must never be committed; only `.env.example` is tracked.
- The notifications queue can be disabled with `NOTIFICATIONS_QUEUE_ENABLED=false` when Redis is unavailable.
