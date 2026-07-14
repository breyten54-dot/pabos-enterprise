# PABOS Enterprise — System Architecture Specification

**Version:** 1.0  
**Status:** Draft  
**Prepared for:** Praeto Risk & Insurance Management Solutions  
**Project root:** `HIVE/Praeto Office AI Portal/`

---

## 1. Purpose and Scope

This document translates the PABOS Enterprise Software Requirements Specification (SRS) into an engineering blueprint. It defines the application architecture, technology stack, data model, identity model, AI orchestration, deployment topology, and operational practices required to build, run, and scale the platform.

The architecture is designed for:

- A **single-brokerage pilot** on modest on-premise hardware.
- A **multi-tenant private cloud** as the commercial product matures.
- Strict compliance with **POPIA, FAIS, FICA, and TCF** from day one.
- A **human-in-the-loop AI** layer that assists staff without taking autonomous client-facing actions.

---

## 2. Design Principles

| Principle | Implication |
|---|---|
| **API-first** | Every capability is exposed via REST/JSON APIs; the web UI is a consumer. Future mobile or partner integrations reuse the same APIs. |
| **Modular monolith first** | Start as a well-modularised monolith to reduce operational overhead. Clear service boundaries allow extraction to microservices later without rewrites. |
| **Tenant-aware data model** | Schema and query patterns support multi-tenancy before the second brokerage is onboarded. |
| **Compliance by design** | Audit logs, consent records, RBAC, and data retention are core infrastructure, not add-ons. |
| **AI as a service** | The AI layer is an isolated orchestration service with a clear contract. It can run local models, private APIs, or public APIs with masking. |
| **Infrastructure as code** | All environment configuration is version-controlled and reproducible. |
| **Progressive scale** | The same software stack runs on one workstation today and a clustered environment tomorrow. |

---

## 3. Technology Stack

| Layer | Technology | Rationale |
|---|---|---|
| **Backend** | NestJS (TypeScript, Node.js) | Strong modularity, decorators, built-in DI, existing Praeto Balance experience, excellent TypeScript support. |
| **ORM / DB access** | Prisma | Type-safe migrations, schema management, good PostgreSQL support. |
| **Primary database** | PostgreSQL 16 | Robust, well-understood, supports row-level security, JSONB, full-text search, pgvector extension. |
| **Cache / sessions / queues** | Redis 7 | Caching, BullMQ job queues, session store, rate-limit counters. |
| **Job queue** | BullMQ | Redis-backed, reliable, supports delayed jobs, retries, and job dashboards. |
| **Frontend** | React 18 + Vite + TanStack Query | Fast builds, modern React patterns, robust server-state management. |
| **UI components** | Tailwind CSS + Headless UI | Rapid, consistent, accessible UI without heavy lock-in. |
| **AI orchestration** | NestJS service + LangChain/LangGraph abstractions | Keeps AI logic testable and swappable; supports local and remote models. |
| **Vector store** | pgvector (via PostgreSQL) | Avoids a separate database initially; good enough for RAG at pilot scale. |
| **Object storage** | MinIO | S3-compatible, on-premise friendly, scalable. |
| **Reverse proxy** | Traefik or Nginx | Traefik for automatic service discovery; Nginx for static simplicity. Start with **Nginx**. |
| **Search** | PostgreSQL full-text search initially; Meilisearch later if needed. | Reduces moving parts at pilot stage. |
| **Monitoring** | Grafana + Prometheus + Loki | Open-source, on-premise friendly, covers metrics, logs, and alerting. |
| **Container runtime** | Docker + Docker Compose | Matches the lean hardware strategy; easy path to Kubernetes later. |
| **CI/CD** | GitHub Actions | Existing tooling; build, test, containerise, and publish artifacts. |
| **Secrets management** | Docker secrets / HashiCorp Vault (later) | Docker secrets for single-node; Vault when clustering. |

---

## 4. Application Architecture

### 4.1 High-level overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Clients                              │
│   Web Browser (Staff)     Mobile (Future)    Partners API   │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS
┌───────────────────────▼─────────────────────────────────────┐
│                    Nginx (Reverse Proxy)                    │
│          TLS termination, static assets, rate limit         │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Web App    │ │  API Gateway │ │   AI Copilot │
│  (React SPA) │ │   (NestJS)   │ │   Service    │
└──────────────┘ └──────┬───────┘ └──────┬───────┘
                        │                │
        ┌───────────────┼────────────────┼───────────────┐
        ▼               ▼                ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  PostgreSQL  │ │    Redis     │ │    MinIO     │ │   Grafana    │
│   (data)     │ │ (cache/jobs) │ │   (files)    │ │  (observe)   │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

### 4.2 Backend modules (NestJS)

The backend is organised into bounded contexts. Each context owns its own Prisma models, controllers, services, events, and tests.

| Module | Responsibility |
|---|---|
| `iam` | Identity, authentication, MFA, sessions, RBAC, organisations |
| `crm` | Clients, contacts, relationships, consent, interaction history |
| `policy-admin` | Policies, endorsements, renewals, cancellations, schedules |
| `claims` | Claim registration, documents, status workflow, settlement |
| `workflow-engine` | Activity codes, tasks, SLA timers, escalations, queues |
| `ai-copilot` | Intake analysis, workflow suggestions, drafting, compliance flags |
| `knowledge-base` | SOPs, insurer rules, prompts, FAQs, vector search |
| `compliance` | FAIS/FICA/POPIA/TCF records, complaints, audit support |
| `notifications` | Email, SMS, in-app notifications, templates |
| `documents` | Upload, versioning, linking, MinIO integration |
| `reporting` | Aggregations, dashboards, exports |
| `audit` | Centralised audit log consumer and query API |

### 4.3 Frontend architecture

- **Single-page application (SPA)** served as static files.
- **Role-based module loading:** the router shows/hides modules based on permissions.
- **Feature folders:** each major feature (clients, policies, claims, tasks, etc.) owns its components, hooks, API calls, and tests.
- **State:**
  - Server state: TanStack Query.
  - UI state: React context or Zustand.
  - Form state: React Hook Form + Zod.

### 4.4 Service-boundary strategy

Start as a **modular monolith** deployed as one API container. Boundaries are strict:

- Modules communicate via internal events (NestJS EventEmitter) and shared kernel only.
- No module imports another module’s internals; only public service interfaces.
- When a module needs independent scaling or a separate team, it can be extracted into its own container with minimal change.

Candidate future microservices:

- `ai-copilot` (heavy GPU/model load)
- `documents` (large file traffic)
- `reporting` (long-running analytics)
- `notifications` (high-volume outbound messages)

---

## 5. Database Architecture

### 5.1 PostgreSQL as the primary store

- One logical database per deployment.
- Prisma migrations version-controlled in `backend/prisma/migrations/`.
- Row-level security (RLS) policies enforce tenant and branch scoping where appropriate.
- Read replicas considered once reporting load grows.

### 5.2 Multi-tenancy model

**Strategy:** Shared database, shared schema, tenant-discriminated rows.

- Every tenant-aware table has `organisationId` and optionally `branchId`.
- The IAM module resolves the current user’s organisation at request time.
- All repository queries automatically append the tenant filter.
- Future multi-tenant releases can move to schema-per-tenant or database-per-tenant without changing application code.

### 5.3 Key entities

| Entity | Purpose |
|---|---|
| `Organisation` | A brokerage tenant. |
| `Branch` | A physical or logical office within an organisation. |
| `User` | A system user with role assignments. |
| `Role` / `Permission` | RBAC definitions. |
| `Client` | A person or entity that buys insurance. |
| `Policy` | An insurance policy record. |
| `PolicyAmendment` | Endorsements, cancellations, renewals. |
| `Claim` | A claim record linked to a policy. |
| `Task` | A workflow task with assignee, due date, status, SLA. |
| `ActivityCode` | Standardised work type (e.g., add vehicle, address change). |
| `Document` | Metadata for a file stored in MinIO. |
| `ConsentRecord` | POPIA consent and processing lawful basis. |
| `AuditLog` | Immutable record of significant actions. |
| `KnowledgeArticle` | SOP, insurer rule, prompt, FAQ. |
| `KnowledgeEmbedding` | Vector embedding for RAG (stored via pgvector). |


---

## 6. Identity and Access Management

### 6.1 Authentication

- **Username + password** with Argon2id hashing.
- **JWT access tokens** (short-lived, e.g., 15 minutes) + **rotating refresh tokens** stored hashed in PostgreSQL.
- **Session binding:** tokens tied to a device/session fingerprint; suspicious sessions require re-authentication.
- **SSO readiness:** OAuth2/OIDC module预留 to integrate Microsoft Entra ID or Google Workspace later.

### 6.2 Multi-factor authentication

- **TOTP** (Google Authenticator / Microsoft Authenticator) enforced for:
  - Admin users
  - Compliance officers
  - Users performing high-risk actions (policy amendments, claims payments, client data exports)
- **WebAuthn / hardware keys** considered for future hardening.

### 6.3 Authorisation model

**Role-Based Access Control (RBAC)** with resource-level permissions.

- `Role`: e.g., Reception, Claims Consultant, Commercial Underwriter, Manager.
- `Permission`: granular actions such as `client:read`, `policy:amend`, `claim:settle`, `report:executive`.
- `Data scope`: users can be restricted to a branch or own-client list.
- All authorisation decisions are logged to the audit service.

### 6.4 Organisation and branch scoping

- Every user belongs to an `Organisation`.
- Optional `Branch` assignment restricts data visibility.
- A Praeto super-admin role manages tenant onboarding and system configuration.

---

## 7. AI Orchestration Layer

### 7.1 Architecture

The AI Copilot is a dedicated NestJS service with a well-defined contract:

```
Client enquiry / request
        │
        ▼
┌─────────────────┐
│  Intake Parser  │  → activity code, priority, missing info
└────────┬────────┘
         │
┌────────▼────────┐
│ PII Masking     │  → mask names, IDs, phone numbers, policy numbers
└────────┬────────┘
         │
┌────────▼────────┐
│ Model Router    │  → local LLM / Azure OpenAI / OpenAI
└────────┬────────┘
         │
┌────────▼────────┐
│ Workflow Engine │  → task list, compliance flags, draft response
└─────────────────┘
```

### 7.2 Data masking and PII protection

Before any text leaves the premises:

- Named entities are detected and replaced with tokens (e.g., `[NAME_1]`, `[POLICY_1]`).
- A reversible token map is stored in Redis/PostgreSQL and expires after a short TTL.
- Raw data never reaches third-party AI providers unless explicitly approved.
- Local models (e.g., Llama 3 via Ollama) can be used for sensitive enquiries to keep data on-premise.

### 7.3 Model strategy

| Stage | Model Option | Use Case |
|---|---|---|
| Pilot | Local LLM (Llama 3 / Mistral via Ollama) + optional public API for non-sensitive drafting | Keep PII on-premise; prove value. |
| Growth | Azure OpenAI with private endpoint or dedicated instance | Better performance, enterprise SLA, data protection addendum. |
| Scale | Mix of local models for sensitive tasks and private cloud APIs for complex reasoning | Cost/performance optimisation. |

### 7.4 Retrieval-Augmented Generation (RAG)

- Knowledge articles are chunked, embedded, and stored in `KnowledgeEmbedding` (pgvector).
- The AI service retrieves relevant articles before generating a response.
- Source citations are returned so staff can verify AI guidance.
- Articles are versioned; old embeddings are marked stale when content changes.

### 7.5 Human approval gates

- All AI-drafted client communications are held in a "pending review" state.
- A user with the appropriate role must approve before send.
- High-risk AI suggestions (e.g., claim settlement recommendations) require manager sign-off.

---

## 8. Email and Notification Services

### 8.1 Email

- **SMTP relay** via Microsoft 365 (Praeto’s existing tenant) or Google Workspace.
- **Template engine** (Handlebars or React Email) for professional, branded emails.
- **Outbound queue** via BullMQ with retry and bounce handling.
- **Email threading:** replies are linked to the originating client/policy/claim record.

### 8.2 SMS

- Provider abstraction (Twilio, Clickatell, or local SMS gateway).
- Used for MFA, appointment reminders, and urgent claim updates.

### 8.3 In-app notifications

- Real-time notification feed using Server-Sent Events (SSE) or WebSockets.
- Notification preferences per user.

### 8.4 WhatsApp Business (future)

- Planned for client self-service and status updates.
- Requires Meta Business approval; integration treated as a future phase.

---

## 9. File Storage Strategy

### 9.1 Object storage

- **MinIO** runs as an S3-compatible service inside Docker.
- Buckets:
  - `pabos-documents-{organisationId}` — client/policy/claim documents.
  - `pabos-exports` — generated reports and exports.
  - `pabos-logs` — archived audit logs.
- Files are encrypted at rest using MinIO server-side encryption (KMS or passphrase).

### 9.2 Document management

- Documents are versioned in the `Document` table.
- Metadata: owner, linked entity, classification, retention date, POPIA consent reference.
- Virus scanning via ClamAV container before permanent storage.
- Large files (>100 MB) uploaded via presigned URLs.

### 9.3 Nextcloud integration (optional)

- Staff can sync selected folders to Nextcloud for desktop/mobile access.
- Integration is read/write via WebDAV or S3 bridge.

---

## 10. Logging, Monitoring, and Observability

### 10.1 Logging

- Structured JSON logs from every service.
- Correlation IDs propagated across API calls and background jobs.
- Sensitive fields redacted automatically.
- Log retention: 90 days hot, 1 year cold archive.

### 10.2 Metrics

- Prometheus scrapes application and infrastructure metrics.
- Key metrics:
  - API request latency and error rates
  - Task queue depth and processing time
  - AI request latency and token usage
  - Login success/failure rates
  - Export generation time

### 10.3 Alerting

- Alertmanager routes alerts to email/Slack/SMS.
- Initial alert rules:
  - API error rate > 1% for 5 minutes
  - Queue depth > 1000 for 10 minutes
  - Database connection pool exhausted
  - Disk usage > 80%
  - Backup failure

### 10.4 Dashboards

- Grafana dashboards for infrastructure, application, and business operations.
- Business dashboards embedded in PABOS reporting module via iframe or API.

---

## 11. Deployment Topology

### 11.1 Single-node pilot

One refurbished workstation hosts all services via Docker Compose:

```yaml
services:
  nginx
  api          # NestJS monolith
  web          # React SPA static files
  ai-copilot   # AI orchestration service
  postgres     # Primary database
  redis        # Cache, sessions, queues
  minio        # Object storage
  loki         # Log aggregation
  prometheus   # Metrics
  grafana      # Dashboards
  backup       # Scheduled backup job
```

### 11.2 Network layout

- Public DNS points to Nginx.
- Nginx terminates TLS using Let’s Encrypt or Praeto’s certificate.
- Internal services communicate on an isolated Docker network.
- Only Nginx, MinIO (for direct uploads), and Grafana (if externally exposed) are reachable from outside.

### 11.3 Path to scale

When load demands it:

1. Move PostgreSQL to a dedicated database server with replicas.
2. Move MinIO to a distributed cluster.
3. Add API container replicas behind Nginx load balancing.
4. Move background workers to dedicated worker nodes.
5. Introduce Kubernetes for container orchestration.

---

## 12. High Availability and Disaster Recovery

### 12.1 Pilot HA assumptions

The pilot runs on a single node. HA is provided by:

- RAID 1 NVMe SSDs for OS and application resilience.
- Daily automated backups to external USB drive and encrypted cloud storage (e.g., Backblaze B2 or AWS S3 Glacier).
- Documented runbook for rebuilding the server from backups.

### 12.2 Backup strategy

| Data | Frequency | Retention | Destination |
|---|---|---|---|
| PostgreSQL | Daily full + hourly WAL | 30 days local, 1 year cold | External drive + cloud |
| MinIO objects | Daily sync | 90 days | External drive + cloud |
| Configuration | On change | Indefinite | Git repository |

### 12.3 Recovery objectives

- **RPO (Recovery Point Objective):** 1 hour (with WAL archiving).
- **RTO (Recovery Time Objective):** 4 hours for pilot; 1 hour once standby server is introduced.

### 12.4 Future HA

- Active/passive standby server with streaming replication.
- Load balancer failover.
- Off-site disaster recovery site.

---

## 13. DevSecOps Pipeline

### 13.1 Source control

- GitHub repository: `praeto-bos-enterprise` (private).
- Branching: `main` (production-ready), `develop` (integration), feature branches.
- Signed commits encouraged for configuration and release artifacts.

### 13.2 CI/CD (GitHub Actions)

| Stage | Tools |
|---|---|
| Lint | ESLint, Prettier, markdownlint |
| Unit tests | Jest / Vitest |
| Integration tests | Testcontainers (PostgreSQL, Redis, MinIO) |
| SAST | Semgrep, CodeQL |
| Dependency scanning | Dependabot, npm audit |
| Container scanning | Trivy |
| Build | Docker image build |
| Publish | GitHub Container Registry |
| Deploy | SSH + Docker Compose pull/restart (manual approval) |

### 13.3 Environment promotion

- `dev` → local Docker Compose on developer machine.
- `staging` → replica environment for UAT.
- `production` → Praeto on-premise server.

### 13.4 Secret management

- Development: `.env.example` files only; real values in local `.env` never committed.
- Production: Docker secrets or HashiCorp Vault.
- CI/CD: GitHub secrets for registry and deployment credentials.

---

## 14. Testing Strategy

### 14.1 Test pyramid

| Level | Tool | Coverage target |
|---|---|---|
| Unit | Jest / Vitest | Business logic, utilities, validators |
| Integration | Jest + Testcontainers | Repository, service, API contracts |
| E2E | Playwright | Critical user journeys |
| Compliance | Custom test suites | RBAC, audit logging, POPIA retention, FICA fields |
| Performance | k6 or Artillery | API latency under expected load |

### 14.2 Critical journeys to test

- Login → MFA → role-based navigation.
- Client intake → task creation → AI suggestion → human approval.
- Policy amendment → document upload → insurer notification.
- Claim registration → status workflow → settlement recording.
- Report export → data scope respected by role.

### 14.3 Compliance tests

Automated assertions that:

- Users cannot access clients outside their branch.
- Audit logs record every create/update/delete on sensitive entities.
- PII is masked before leaving the AI service.
- Deleted data is soft-deleted and retained per policy.

---

## 15. Security Architecture

### 15.1 Defence layers

| Layer | Control |
|---|---|
| Network | TLS 1.3, firewall, internal Docker network, VPN for management |
| Application | RBAC, input validation, output encoding, rate limiting, CSRF protection |
| Data | Encryption at rest (AES-256), encryption in transit (TLS), field-level encryption for ID numbers if required |
| Identity | MFA, strong passwords, session expiry, brute-force protection |
| Operations | Least privilege, audit logs, automated patching, vulnerability scanning |

### 15.2 POPIA-specific controls

- Consent records and lawful basis captured per client.
- Data minimisation enforced by mandatory/restricted fields.
- Retention policies with automated purging after legal retention period.
- Right of access and deletion workflows.
- Data processing agreements documented for any third-party AI provider.

### 15.3 FAIS/FICA-specific controls

- FAIS fit-and-proper flags on advice-boundary features.
- FICA identity verification status recorded per client.
- Record-keeping retention aligned with regulatory requirements.

---

## 16. Compliance Mapping

| Requirement | Architectural Control |
|---|---|
| FAIS advice boundary | AI suggestions are advisory; human approval required for advice-like outputs. |
| FICA record-keeping | Immutable `Client` verification records and audit logs. |
| POPIA lawful processing | `ConsentRecord` entity and role-based data access. |
| POPIA data minimisation | Mandatory field validation and PII masking in AI service. |
| POPIA security safeguards | Encryption, RBAC, MFA, audit logs, backups. |
| TCF fairness | Workflow standardisation, SLA tracking, complaint register. |
| Binder agreements | Insurer-specific rules stored in knowledge base and enforced in workflows. |
| Audit readiness | Centralised `AuditLog` with correlation IDs and tamper-evident exports. |

---

## 17. Migration and Rollout

### 17.1 Pilot scope

Start with **one branch and two business processes**, for example:

1. New policy intake for personal lines motor.
2. Address change endorsement.

### 17.2 Data migration

- Legacy client and policy data imported via CSV/Excel templates.
- Import jobs run via BullMQ with validation and error reports.
- Historical documents uploaded in bulk to MinIO.

### 17.3 Training

- Role-specific training modules linked to the knowledge base.
- AI copilot assists users in real time during the pilot.
- Feedback captured weekly and fed back into SOPs and prompts.

---

## 18. Open Architecture Decisions

| Decision | Options | Recommendation |
|---|---|---|
| AI model hosting | Local LLM vs. Azure OpenAI vs. hybrid | **Decided: local LLM first** (Ollama/LM Studio). Keeps PII on-premise. Re-evaluate Azure OpenAI only if local model quality becomes a blocker. |
| Identity provider | Built-in vs. Keycloak vs. Microsoft Entra ID | **Decided: built-in first** (NestJS IAM module). Entra ID integration deferred to Phase 10. |
| Workflow engine | In-house vs. Temporal vs. Camunda | In-house first; evaluate Temporal if complexity grows. |
| Frontend framework | React SPA vs. Next.js | React SPA (simpler on-prem deployment). |
| Search engine | PostgreSQL FTS vs. Meilisearch | PostgreSQL FTS initially; Meilisearch if search becomes critical. |
| Reporting | In-app aggregations vs. Metabase/Superset | In-app KPIs first; Metabase for ad-hoc analytics. |

---

## 19. Next Steps

1. Review and approve this SAS.
2. Answer the open architecture decisions.
3. Lock the pilot scope (branch + two processes).
4. Create the initial database schema and project skeleton.
5. Set up the development environment and CI/CD pipeline.
