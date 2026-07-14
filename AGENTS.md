# AGENTS.md — PABOS Enterprise

**Applies to:** every AI assistant working in `HIVE/Praeto Office AI Portal/`.

## Project identity

- **Name:** PABOS Enterprise (Praeto AI Brokerage Operating System)
- **Client:** Praeto Risk & Insurance Management Solutions
- **Domain:** Insurance brokerage operations — short-term, medical schemes, life, employee benefits, commercial fleets, municipalities, SOEs, private clients
- **Status:** MVP skeleton wired and running locally (IAM, CRM, policy admin, AI intake). No production deployment yet.
- **Root folder:** `HIVE/Praeto Office AI Portal/`

## Golden rules

1. **Documentation first.** No code or infrastructure changes without an approved spec or backlog item. The SRS and the backlog are the source of truth.
2. **No secrets in HIVE.** Never write passwords, API keys, client data, policy numbers, ID numbers, medical details, or financial records into any file in this folder. Use `.env.example` templates only.
3. **Regulatory-first design.** Every feature must be evaluated against FAIS, FICA, POPIA, TCF, binder agreements, and insurer mandates. If a requirement conflicts with compliance, flag it and stop.
4. **Human-in-the-loop AI.** AI outputs are advisory/draft only. No client-facing action may be taken without explicit authorisation by an authorised Praeto user.
5. **No unilateral deploys.** Do not deploy to any environment (cloud, on-prem, Firebase, Vercel, Render, etc.) without explicit user approval.
6. **One source of truth.** If a spec, backlog item, and code disagree, the spec wins until the user approves a change.

## Folder conventions

- `docs/` — Engineering specs, backlogs, decision records
- `backend/` — Server-side application code (NestJS / FastAPI / similar to be chosen in SAS)
- `frontend/` — Web application code
- `ai-prompts/` — Versioned prompt libraries by role and line of business
- `tests/` — Unit, integration, compliance, and E2E tests
- `infra/` — Docker, Terraform/Ansible, deployment manifests

## Naming

- Documents: `PABOS-{TYPE}-v{MAJOR}.{MINOR}.{PATCH}.md` (e.g. `PABOS-SRS-v1.0.0.md`)
- Code modules: domain-driven (`policy-admin/`, `claims/`, `workflow-engine/`, `ai-copilot/`)
- Branches/commits: conventional commits referencing backlog item IDs once an issue tracker exists

## What to do when you start

1. Read this file.
2. Read `docs/PABOS-SRS-v1.0.md`.
3. Read `docs/BACKLOG.md`.
4. Ask the user which backlog item to tackle, or propose the next most important deliverable.

## What not to do

- Do not generate 300 prompts and call the project done.
- Do not recommend public AI tools for processing real client data without a data-processing and masking strategy.
- Do not build a full production database schema before the SAS is written.
- Do not commit or deploy anything that handles real client data.

## Compliance checklist for every feature

Before marking any feature complete, confirm:

- [ ] FAIS fit-and-proper / advice-boundary considerations documented
- [ ] FICA identity/record-keeping requirements met
- [ ] POPIA data minimisation, lawful processing, and retention documented
- [ ] TCF fairness and disclosure requirements met
- [ ] Audit trail captured
- [ ] Role-based access enforced
- [ ] AI output is clearly labelled and requires human approval before external action
