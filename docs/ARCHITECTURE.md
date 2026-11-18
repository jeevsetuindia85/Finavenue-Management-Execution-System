# Management Execution & Goal Tracking Platform
## Architecture & Technical Design

### 1. Overview
Production-ready collaborative web application for converting annual business goals into measurable weekly activities, with accountability, monitoring, and review cadence.

**Core Principle**: Track whether the *required work* was completed every week, not only final outcomes.

### 2. Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend | React 18 + TypeScript + Vite | Modern, fast, type-safe UI |
| UI Library | Tailwind CSS + shadcn/ui inspired components | Clean corporate SaaS look (Linear/Notion/Asana style) |
| State | Zustand + React Query | Lightweight global state + server state |
| Backend | Python 3.12 + FastAPI | High performance, auto-docs, async ready |
| ORM | SQLAlchemy 2.0 + Alembic | Robust migrations, type hints |
| Database | SQLite (dev/demo) / PostgreSQL (prod) | Easy local start; production-ready path |
| Auth | JWT + OAuth2 (password + Google) | Secure, standard |
| Calendar | Google Calendar API v3 + OAuth 2.0 | Required integration |
| Notifications | In-app + Email (SMTP / SendGrid ready) | Extensible |
| File Storage | Local (dev) / S3-compatible (prod) | Attachments support |
| Export | openpyxl + reportlab | Excel + PDF |

### 3. High-Level Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│  React Frontend │────▶│  FastAPI Backend │────▶│  SQLite / PG    │
│  (Vite + TS)    │     │  (JWT + RBAC)    │     │  + Alembic      │
└────────┬────────┘     └────────┬─────────┘     └─────────────────┘
         │                       │
         │              ┌────────▼─────────┐
         └─────────────▶│ Google Calendar  │
                        │ OAuth + API      │
                        └──────────────────┘
```

### 4. Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **Management / Admin** | Full access, create/edit goals, manage users, all reports, approve |
| **Goal Owner** | Manage assigned goals, assign activities, view team progress |
| **Team Member** | Update own activities, upload evidence, comments, personal calendar |
| **Coordinator (Maitwayi)** | Collect updates, follow-ups, prepare reviews, meeting minutes, MIS |
| **Dashboard Admin** | Users, permissions, master data, system config |

Hybrid ownership model: Activity owners update their work; Coordinator monitors and prepares reviews; Management has visibility + decision rights.

### 5. Core Modules Mapping to Spec

1. **Executive Dashboard** – Live KPIs, goal cards, charts, alerts
2. **Goals & Objectives** – Goal Master + detailed goal dashboards
3. **Activity Tracker** – Central task management with audit trail
4. **Hiring Management** – Agency, Network, Conference trackers + Candidate Pipeline
5. **Office Expansion** – City-wise (Ahmedabad / Bangalore) office + BD hiring
6. **Product Development** – Configurable milestones for PMS / AIF etc.
7. **Weekly Reviews & Meetings** – Saturday primary / Tuesday fallback + Red Alert
8. **Calendar & Reminders** – In-app + Google Calendar two-way sync
9. **Team & Users** – RBAC, invitations, profiles
10. **Reports & Analytics** – Filtered Excel/PDF/CSV exports
11. **Settings** – Notification prefs, Google connection, company config

### 6. Key Design Principles (from source document)
- Input before output
- Clear single accountability + due date
- Evidence-based updates
- Review discipline (missed review = visible exception)
- Separate goal / city / product views
- Full audit trail

### 7. Development Phases (as specified)

**Phase 1 – Core Foundation**
- Auth + User management
- Goal Master
- Executive Dashboard (live data)
- Activity Tracker
- Weekly Review System (Saturday/Tuesday logic)

**Phase 2 – Business Modules**
- Hiring (Agency CRM, Pipeline, Network, Events)
- Office Expansion (city-independent views)
- Product Development
- Collaboration features
- Reports

**Phase 3 – Automation & Integrations**
- Google Calendar OAuth + two-way sync
- Automatic notifications & reminders
- Advanced analytics & exports
- Email system

### 8. Status Logic (RAG + Grey)
- **Green**: Completed within period + target met
- **Amber**: Partial / approaching due / below target
- **Red**: Overdue / missing update / missed review
- **Grey**: Not yet due / N/A

Status calculated from due dates + actuals wherever possible.

### 9. Weekly Review Control Flow
1. System schedules Saturday review
2. Reminder before Saturday
3. If not completed → Pending + prompt for Tuesday
4. If Tuesday also missed → Red Alert raised
5. Meeting record required to mark complete (authorized user)

### 10. Google Calendar Integration Requirements
- OAuth 2.0 (no password storage)
- Per-user connection
- Create events for activities / reviews / interviews / visits / milestones
- Two-way sync with conflict detection & logging
- Incremental sync / sync tokens
- Handle token expiry & revocation gracefully
- In-app calendar views (day/week/month) with labels

### 11. Security
- Password hashing (bcrypt / argon2)
- JWT access + refresh tokens
- Role checks on every protected endpoint
- Input validation (Pydantic)
- File upload validation
- Audit log for status / assignment changes
- Secrets via environment variables

### 12. Sample Data Policy
Realistic demo data is provided and clearly labelled. No hard-coded KPI numbers in UI; all derived from DB.
