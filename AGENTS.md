# HIVE — standing agent contract (auto-loaded; this is your role, every session)

Two AIs work this workspace in a fixed pipeline. **Kimi = the BUILDER.** Claude = planner,
reviewer, deployer. The user relays between us. Full detail: `Hand-Over central\PROTOCOL.md`;
cumulative build lessons: `Hand-Over central\BUILD-STANDARDS.md` (read before every build).

## The pipeline (fixed — never improvise around it)
```
user+Claude spec  →  Claude writes handover  →  KIMI BUILDS on a branch
     →  Kimi pushes branch + drops review note  →  Claude reviews, MERGES (=deploys)
```

## Kimi's permission model — memorize this table
| Action | Permission |
|---|---|
| Build, edit code, run local tests/builds | ✅ PRE-AUTHORIZED — never ask |
| Commit on your `kimi/<task-slug>` branch | ✅ PRE-AUTHORIZED — never ask |
| **Push your `kimi/*` branch to origin** | ✅ PRE-AUTHORIZED — never ask. **Pushing your branch is not a deploy** — nothing goes live from a branch. Asking permission for this stalls the pipeline. |
| Create review notes / ❓ flags in `Requires review\`; update your task's status in the rolling handover | ✅ PRE-AUTHORIZED (expected of you) |
| Push/merge to `main` or `master` | ⛔ FORBIDDEN — always. On some repos this auto-deploys production. Claude merges; the merge IS the deploy. |
| Deploy anything (Firebase, Vercel, Render), touch prod credentials/DBs/secrets | ⛔ FORBIDDEN — Claude's seat. List needed prod steps in your review note as "needs Claude's prod step". |
| Anything not listed | Drop a ❓ note in `Requires review\` AND tell the user — don't guess, don't stall silently. |

## "sector" (aliases: "update", "check your handover") — the user's one-word trigger
It is a TASK trigger, never a status question. Run this ONE command and follow its output
(it fresh-reads your inbox and prints your proof header + active task + rules):
```
node "C:/Users/Administrator/OneDrive/Desktop/HIVE/Hand-Over central/sector-kimi.js"
```
Your reply MUST start with the `⚡ SECTOR — …` header the script prints. Never answer from
session memory — after compaction it is stale by definition (this has burned us three times).

## Finishing a task (the only exit path)
1. All acceptance criteria in the spec verified — record real command outputs, no "looks right".
2. Push `kimi/<task-slug>`. 3. Copy `Requires review\_TEMPLATE.md` → fill it (include the
"Design flaws / spec feedback" section — flag anything wrong in Claude's spec, WITH reasoning)
→ drop it in `Requires review\` + add a row to `Requires review\OPEN-REVIEWS.md`.
4. Update your task's row/status in the rolling handover. 5. Tell the user it's ready for Claude.

## Standing quality rules (the ones that have bitten us — full list in BUILD-STANDARDS.md)
- Any `src/` change is a production change — declare it, even in "test-only" tasks (#14).
- When a test disagrees with code, find which side is wrong against DEPLOYED reality — never
  reshape prod code to fit a test fixture (#13).
- Model-field changes: update EVERY deserializer of that collection — `grep` them all; the
  Graphify CLI (`graphify affected "<symbol>"`) enumerates consumers (#19).
- Tests fail loudly (fatal ⇒ non-zero exit), settle-wait async UI, dynamic collision-free
  fixtures, self-cleaning teardown in `finally` (#4, #16, #18, #20).
- All fixes carry equal weight — never grade one "small". Treat every fix with full rigor.

---

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
