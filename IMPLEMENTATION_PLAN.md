# ExecFlow — Management Execution System
## Master Implementation Plan

**System**: ExecFlow Management Execution & Goal Tracking SaaS  
**Architecture**: Python FastAPI (Async SQLAlchemy + SQLite/PostgreSQL) + React 18 (TypeScript + Vite + Tailwind CSS + Lucide + Recharts)  
**Execution Strategy**: Full-stack phased build with live verification after each phase.

---

### Phase Roadmap & Execution Tasks

#### Phase 0 — Workspace Inspection & Architecture Blueprint (Completed)
- [x] Inspect existing workspace, directory tree, models, and scripts.
- [x] Analyze attached 9-page management specification blueprint.
- [x] Create `PROJECT_ANALYSIS.md`, `IMPLEMENTATION_PLAN.md`, `DATABASE_SCHEMA.md`, `FEATURE_CHECKLIST.md`.

#### Phase 1 — Backend Core & Domain Fixes
- [x] Fix `ProductMilestone` model to include `completion_percentage`.
- [x] Fix `scripts/seed_demo_data.py` and populate `mes.db` with realistic, interconnected demo data.
- [x] Verify auth endpoints, JWT generation, password verification, and RBAC security dependencies.
- [x] Verify `/api/v1/dashboard` metrics and ensure zero hardcoded values.

#### Phase 2 — Extended Backend Business Routers
- [ ] Create `backend/app/api/hiring.py`:
  - Agency CRM: List, create, update, follow-up logs, CV metrics.
  - Candidate Pipeline: Stage movement (Source → CV Received → Screening → Interview → Selected → Offer → Joined/Rejected), interview logs, resume metadata.
  - Professional Network: Reference calls (target: 4/week), contacts approached, referrals.
  - Conference Tracker: Industry events (target: 1 every 15 days), attendance status, post-event outreach.
  - Sourcing and pipeline summary metrics.
- [ ] Create `backend/app/api/expansion.py`:
  - Ahmedabad & Bangalore independent dashboards.
  - Coworking space comparison (rent, deposit, capacity, proposal status, selection).
  - Site visit logs, observations, and attendee tracking.
  - City BD hiring pipeline and target headcount progress.
- [ ] Create `backend/app/api/products.py`:
  - Products catalog (PMS, CAT II AIF, CAT III AIF, custom).
  - Milestone checklist (Concept through Launch), status, owner, completion percentage, evidence attachments.
- [ ] Create `backend/app/api/calendar.py`:
  - Google OAuth URL generator, token exchange callback, connection status, disconnect.
  - Two-way sync engine: mapping activities, reviews, interviews, site visits to Google Calendar events.
- [ ] Create `backend/app/api/notifications.py`:
  - Fetch active notifications, mark as read, mark all read.
  - Trigger rule evaluation (overdue tasks, missing reviews, pending agency follow-ups).
- [ ] Create `backend/app/api/reports.py`:
  - Excel (.xlsx) export using `openpyxl` across multiple formatted sheets.
  - PDF export using `reportlab`.
  - CSV exports for activities, candidates, and weekly reviews.
- [ ] Register all new routers in `backend/app/main.py`.

#### Phase 3 — Production Frontend Application
- [ ] Scaffold React + TypeScript + Vite project inside `frontend/`.
- [ ] Configure Tailwind CSS, theme tokens (corporate navy `#0F172A`, teal `#0D9488`, slate background `#F8FAFC`).
- [ ] Install Lucide-React, Recharts, Axios, React Router DOM, date-fns.
- [ ] Implement API Client with JWT interceptors, automatic token refresh, and error notifications.
- [ ] Build Core Layout:
  - Collapsible Left Sidebar (11 navigation items, logo, active indicator).
  - Top Navigation Bar (Global search, reporting period, notification popover, quick persona switcher, user profile).
- [ ] Build 11 Modular Views:
  1. **Executive Dashboard**: 8 KPI Cards, 3 Core Goal Cards, 7 Recharts Data Visualizations, Intelligent Alerts Panel.
  2. **Goals & Objectives**: Goal Master table, detailed goal view, milestones progress, input/output measures.
  3. **Activity Tracker**: Central task management, My Tasks / Assigned by Me / Due This Week / Overdue filters, RAG status pills, Create Task modal, task detail drawer with comments and audit trail.
  4. **Hiring Management**: Role tabs (Senior Analyst, Senior BD, CAT II Fund Manager), Agency CRM table, Candidate Pipeline Kanban board, Professional Network 4 calls/week tracker, Conference 15-day tracker, Candidate modal.
  5. **Office Expansion**: Ahmedabad & Bangalore city toggle, Coworking comparison table, Site visit logs, BD headcount meter.
  6. **Product Development**: Product tabs (PMS, CAT II AIF, CAT III AIF), 9-step launch milestone progress bar, evidence upload, milestone status update modal.
  7. **Weekly Reviews**: Review calendar & status banner (Saturday primary / Tuesday fallback / Red Alert), Review history list, Conduct Review modal (goals reviewed, challenges, decisions, action items with assignees).
  8. **Calendar**: In-app interactive month/week view, entity filters (activities, reviews, interviews, site visits), Google Calendar sync status badge & connect CTA.
  9. **Team Management**: Team directory, role badges, workload distribution, user invitation modal.
  10. **Reports & Analytics**: Downloadable Excel, PDF, CSV exports, compliance reports, weekly management summaries.
  11. **Settings**: User profile, Google Calendar connection manager, notification preferences, system configuration.
  12. **Login Screen**: Professional corporate auth screen with 1-click demo login buttons for all 5 roles.

#### Phase 4 — Testing, Verification & Hardening
- [ ] Run backend automated API tests (pytest / httpx) covering Auth, Activities, Reviews, Hiring, Expansion, Products, Reports.
- [ ] Build and verify frontend production bundle (`npm run build`).
- [ ] End-to-end operational verification across multiple user roles.
- [ ] Update `FEATURE_CHECKLIST.md` with verified status.

#### Phase 5 — Documentation & Deployment Deliverables
- [ ] Create comprehensive `README.md` with Windows CMD and PowerShell instructions.
- [ ] Create `.env.example` with documented configuration parameters.
- [ ] Create `GOOGLE_OAUTH_SETUP.md` for Google Cloud Console setup.
- [ ] Create `LOCAL_INSTALLATION_GUIDE.md` and `DEPLOYMENT_GUIDE.md`.
