# PABOS Enterprise — Delivery Backlog

**Order of importance.** Work from top to bottom; do not skip phases without user approval.

---

## Phase 0 — Foundation (Current)

**Goal:** Establish a single source of truth before any code is written.

- [x] Create project folder and governance (`README.md`, `AGENTS.md`)
- [x] Draft Software Requirements Specification (SRS v1.0)
- [x] System Architecture Specification (SAS)
- [x] Technology stack decision record (documented in SAS)
- [x] Data model conceptual design (Prisma schema created)
- [x] Security and compliance model (documented in SAS and AGENTS.md)
- [x] Roadmap and release plan (this backlog)

---

## Phase 1 — Core Platform

**Goal:** A secure, multi-user foundation.

- [x] Identity & access management (MFA, RBAC)
- [x] User and role administration
- [x] Organisation/branch configuration
- [x] Audit logging framework
- [ ] Notification service (email, in-app) — BullMQ stub in place; real SMTP/SMS integration pending
- [x] System configuration and feature flags
- [x] Basic dashboard and navigation

---

## Phase 2 — CRM

**Goal:** Know your clients and their relationships.

- [x] Client profiles and contact management
- [ ] Interaction history
- [ ] Relationship mapping (groups, fleets, employers)
- [ ] Document upload and linking
- [x] Consent and POPIA management (consent record captured on client creation)

---

## Phase 3 — Policy Administration

**Goal:** Manage the policy lifecycle.

- [x] Policy register
- [x] New policy capture
- [x] Amendments / endorsements (address-change MVP)
- [ ] Renewals and reminders
- [ ] Cancellations
- [ ] Portfolio review scheduling

---

## Phase 4 — Claims

**Goal:** Track claims from registration to settlement.

- [ ] Claim registration
- [ ] Document tracking
- [ ] Status workflow
- [ ] Task assignment and SLA tracking
- [ ] Settlement recording
- [ ] Insurer correspondence

---

## Phase 5 — Workflow Engine

**Goal:** Standardise how work gets done.

- [ ] Activity code library
- [ ] Task templates
- [ ] Automatic task creation from intake
- [ ] SLA and escalation rules
- [ ] Work queues by role

---

## Phase 6 — AI Copilot (MVP)

**Goal:** Assist staff without replacing judgment.

- [x] Secure intake of client enquiries (AI Copilot endpoint live)
- [x] Activity code suggestion
- [x] Task list generation
- [x] Compliance flagging (basic flags returned)
- [ ] Draft client correspondence
- [x] Human approval before send/action (UI enforced in AI intake page)

---

## Phase 7 — Knowledge Base

**Goal:** Make institutional knowledge accessible.

- [ ] SOP library
- [ ] Insurer rules by line of business
- [ ] Product information
- [ ] Prompt library by role
- [ ] FAQ and regulatory guidance

---

## Phase 8 — Compliance & QA

**Goal:** Prove and enforce standards.

- [ ] FAIS control checklist
- [ ] FICA record-keeping
- [ ] POPIA consent and processing records
- [ ] TCF monitoring
- [ ] Complaints register
- [ ] Quality assurance sampling

---

## Phase 9 — Reporting & Intelligence

**Goal:** Measure and improve the business.

- [ ] Operational KPI dashboards
- [ ] SLA and turnaround-time reports
- [ ] Quality metrics
- [ ] Revenue and opportunity reports
- [ ] Executive dashboard

---

## Phase 10 — External Integrations & Scale

**Goal:** Connect the ecosystem.

- [ ] Microsoft 365 email/calendar integration
- [ ] SMS provider integration
- [ ] WhatsApp Business (future)
- [ ] Insurer APIs (future)
- [ ] Accounting system integration
- [ ] Multi-tenant architecture for additional brokerages

---

## Open Questions

1. What is the exact date for the first pilot user group?
2. Which two or three business processes should the MVP handle first?
3. Does Praeto have preferred on-premise hardware vendor relationships?
4. Should the AI layer use a local model, an enterprise API, or a hybrid?
5. What is the record-retention period for client data under Praeto’s compliance policy?
