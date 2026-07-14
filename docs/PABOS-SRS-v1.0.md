# PABOS Enterprise — Software Requirements Specification

**Version:** 1.0  
**Status:** Draft  
**Prepared for:** Praeto Risk & Insurance Management Solutions  
**Project root:** `HIVE/Praeto Office AI Portal/`

---

## 1. Executive Summary

**PABOS Enterprise** is an AI-powered Insurance Brokerage Operating System designed to digitise, automate, standardise, and optimise every operational process within an insurance brokerage.

The platform provides a secure, scalable, cloud-native environment combining:

- Client Relationship Management (CRM)
- Policy Administration
- Claims Management
- Workflow Automation
- AI Decision Support
- Compliance Management
- Knowledge Management
- Document Management
- Staff Training
- Executive Intelligence & Business Analytics

The long-term objective is a single operational platform supporting Praeto and, ultimately, multiple brokerages through a configurable multi-tenant architecture.

---

## 2. Project Objectives

1. Improve operational efficiency.
2. Standardise service delivery.
3. Reduce human error.
4. Strengthen regulatory compliance.
5. Improve client experience.
6. Preserve organisational knowledge.
7. Accelerate staff onboarding and training.
8. Deliver actionable business intelligence.
9. Create a commercial software product.

---

## 3. Stakeholders

### Executive Stakeholders

- CEO
- Executive Management
- Operations Management
- Compliance Management
- Finance

### Operational Users

- Reception
- Personal Lines Consultants
- Commercial Consultants
- Claims Consultants
- Medical Scheme Consultants
- Life Consultants
- Employee Benefits Consultants
- Underwriters
- Account Managers
- Compliance Officers
- Quality Assurance Officers
- Training Officers
- IT Administrators

### External Users (Future Phases)

- Clients
- Intermediaries
- Insurers
- Assessors
- Service Providers

---

## 4. Functional Scope

### Core Platform

- Authentication
- User Management
- Permissions
- Audit Logging
- Notifications
- System Configuration

### CRM

- Client Profiles
- Contact Management
- Interaction History
- Relationship Mapping

### Policy Administration

- Policy Register
- Amendments
- Renewals
- Cancellations
- Portfolio Reviews

### Claims

- Registration
- Workflow Management
- Document Tracking
- Status Monitoring
- Settlement Recording

### Workflow Engine

- Activity Codes
- Task Assignment
- SLA Tracking
- Escalation Rules
- Automation Rules

### AI Copilot

- Intelligent Intake
- Workflow Guidance
- Prompt Orchestration
- Compliance Checks
- Draft Communications
- Knowledge Retrieval

### Knowledge Base

- SOP Library
- Prompt Library
- Insurer Rules
- Product Information
- FAQs
- Regulatory Guidance

### Compliance

- FAIS Controls
- FICA Tracking
- POPIA Controls
- TCF Monitoring
- Complaints Register
- Audit Support

### Reporting & Dashboards

- Operational KPIs
- Service Levels
- Quality Metrics
- Revenue Opportunities
- Executive Dashboard

---

## 5. Non-Functional Requirements

The platform must be:

- Secure by design
- Highly available
- Scalable to multiple brokerages
- Mobile responsive
- Cloud deployable
- Fully audited
- API-first
- Modular and extensible
- Version controlled
- Performance monitored

**Target availability:** 99.9% or better.

---

## 6. Security Requirements

- Multi-factor authentication (MFA)
- Role-based access control (RBAC)
- Encryption in transit (TLS 1.3)
- Encryption at rest (AES-256)
- Comprehensive audit logs
- Session management
- Password policies
- Secure secrets management
- Rate limiting
- Backup and recovery
- Intrusion monitoring
- Principle of least privilege

Sensitive information must be protected in accordance with South African legal obligations and recognised information security best practices.

---

## 7. Integration Requirements

The platform should be designed to integrate with:

- Email services (Microsoft 365 / Google Workspace)
- Calendar platforms
- SMS providers
- WhatsApp Business (future phase)
- Accounting systems
- Document management systems
- AI services
- Future insurer APIs
- Future payment gateways

---

## 8. AI Requirements

The AI layer must:

- Analyse client enquiries.
- Identify activity codes.
- Suggest workflows.
- Draft communications.
- Highlight compliance considerations.
- Retrieve knowledge articles.
- Recommend next steps.
- Support quality assurance.

**Critical constraint:** AI outputs must always be reviewed by an authorised user before client-facing actions are taken.

### Proposed AI Levels

| Level | Function | Example Output |
|---|---|---|
| 1 — AI Reception | Intake and triage | Summary, tasks, priority, missing info, responsible department, SLA, client acknowledgement |
| 2 — AI Process Manager | Step-by-step workflow | Numbered task list with dependencies |
| 3 — AI Compliance Officer | Regulatory check | FAIS, FICA, POPIA, TCF, binder, mandate flags |
| 4 — AI Quality Control | Output review | Grammar, professionalism, legal wording, accuracy, tone, completeness |
| 5 — AI Knowledge Base | Domain guidance | Insurer-specific rules by line of business |

### Role-Based AI Assistants (Future)

Each major role may receive a tailored assistant, including:

- Reception Consultant AI
- Claims Consultant AI
- Commercial Underwriter AI
- Personal Lines AI
- Medical Aid Specialist AI
- Life Specialist AI
- Fleet Specialist AI
- Compliance Officer AI
- Broker Consultant AI
- Sales Consultant AI
- Renewals Consultant AI
- Accounts Consultant AI
- Debt Collection AI
- Management AI

---

## 9. Success Criteria

The initial release will be considered successful if it:

- Reduces average turnaround times.
- Improves first-time accuracy.
- Supports consistent service standards.
- Provides complete audit trails.
- Enables AI-assisted workflows.
- Receives positive feedback from Praeto staff during pilot deployment.

---

## 10. Deployment & Infrastructure Strategy

### Start Lean

To reduce upfront cost without sacrificing architecture:

- **Hardware:** Refurbished business workstation (Dell Precision Tower / HP Z4 G4 / Lenovo ThinkStation P520)
  - 8–12 core CPU
  - 64 GB RAM
  - 2 × 2 TB NVMe SSD (RAID 1)
  - 2 × 8 TB HDD (data + backups)
  - 1000 VA UPS
  - Estimated budget: R25,000–R40,000

- **Software:** Open-source stack
  - Ubuntu Server
  - Docker
  - Nextcloud (file sync)
  - PostgreSQL (database)
  - Nginx (web server)

- **Email:** Continue using Microsoft 365 for email; self-host applications and documents.

- **Storage (initial):**
  - 2 TB SSD for OS and applications
  - 8 TB HDD for business data
  - 8 TB external drive for backups

- **Raspberry Pi role:** VPN access, network monitoring, automated backup scheduling, DNS/network services.

### Future Growth

As demand grows, add:

- More RAM
- Larger drives
- A second server for redundancy
- A dedicated backup NAS

### Long-Term Vision

Design PABOS as a **modular private cloud** that can start on a single refurbished workstation and migrate to rack-mounted enterprise infrastructure later, without changing the software architecture.

---

## 11. Next Deliverable

**System Architecture Specification (SAS)** — to define in engineering detail:

- Application architecture
- Backend services and microservice boundaries
- Database architecture
- Identity and access management
- AI orchestration layer
- Email and notification services
- File storage strategy
- Logging and monitoring
- Deployment topology
- High availability and disaster recovery
- DevSecOps pipeline
- Testing strategy
