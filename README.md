# ExecFlow — Management Execution & Goal Tracking Platform

**ExecFlow** is a production-grade, multi-user enterprise SaaS application designed for company leadership, department heads, and execution teams. It bridges strategic vision with operational reality by converting high-level annual business goals into measurable weekly activities, disciplined review cadences, and dynamic executive dashboards.

```
Annual Strategic Goals
         │
         ▼
Input Measures & KPIs
         │
         ▼
Assigned Weekly Activities (RAG: Green / Amber / Red / Grey)
         │
         ▼
Team Updates, Comments & Evidence
         │
         ▼
Saturday Weekly Review Cadence (Tuesday Fallback & Red Alert)
         │
         ▼
Output Results & Board-Ready Analytics
```

---

## 1. Key Business Modules

### 🎯 1. Goal Master & Alignment (3 Major Annual Goals)
- **Goal 01 — Hiring & Talent Acquisition**:
  - Positions: *Senior Analyst*, *Senior Business Development*, *CAT II Fund Manager*.
  - Sourcing Channels:
    - **Hiring Agency CRM**: Track agency quotas, CV counts, follow-up dates, and reasons for zero CVs.
    - **Professional Network**: Track executive reference calls against the **4 calls / week target**.
    - **Conference Tracker**: Track industry networking events against the **1 event / 15 days cadence**, people met, and follow-ups.
    - **Candidate Pipeline**: 7-stage recruitment funnel (*Source &rarr; CV Received &rarr; Screening &rarr; Interview &rarr; Selected &rarr; Offer &rarr; Joined / Rejected*).
- **Goal 02 — Geographic Expansion (Ahmedabad & Bangalore)**:
  - Independent city dashboards with side-by-side coworking space comparison (seats, monthly rent, deposits, location ratings).
  - Coworking site visits log with attendees and inspection notes.
  - Local Business Development hiring tracker vs city headcount targets.
- **Goal 03 — Product Development (PMS / CAT II AIF / CAT III AIF)**:
  - Configurable 11-stage milestone gates: *Product Concept &rarr; Market Research &rarr; Competitor Analysis &rarr; Strategy Finalization &rarr; Product Structure &rarr; Regulatory & Compliance &rarr; Internal Approval &rarr; Documentation &rarr; Marketing Deck &rarr; Launch Readiness &rarr; Product Launch*.
  - Individual milestone progress %, owner, due date, status, evidence attachment notes, and remarks.

### 📊 2. Executive Management Dashboard
- **8 Dynamic KPI Cards**: Total Active Goals, Completed Goals, Goals at Risk, Overdue Activities, Due This Week, Completed This Week, Pending Action Items, Weekly Review Compliance %.
- **3 Goal Progress Cards**: Real-time progress %, completed/pending/overdue activities, and target completion dates.
- **Intelligent Alerts Panel**: Continuously evaluates 8 strategic bottleneck rules (agency zero-CV warnings, overdue follow-ups, below-target reference calls, missed conferences, pending site visits, delayed product milestones, stale task updates, missed Saturday reviews).
- **7 Interactive Recharts Visualizations**:
  1. *Weekly Planned vs Completed Activities*
  2. *Goal-wise Progress*
  3. *Team-wise Performance*
  4. *Pending vs Overdue Task Distribution*
  5. *Hiring Funnel Across 7 Stages*
  6. *Ahmedabad vs Bangalore Expansion (Target BD vs Actual BD)*
  7. *Product Milestone Completion Rates*
- **Zero Hardcoded Statistics**: Every metric derives dynamically from live database records.

### ✅ 3. Central Activity & Task Management Engine
- **RAG Status Engine**: Automated calculation of `green`, `amber`, `red`, and `grey` statuses based on target vs actual quantities, frequencies, and due dates.
- **6 Activity Views**: *All Activities, My Tasks, Due Today, Due This Week, Overdue Backlog, Completed*.
- **Activity Drawer**: Full task details, status transitions, comments thread, and audit trail timeline.

### 📅 4. Weekly Review Cadence (Mandatory Business Control)
- **Cadence Rules**:
  - Primary Review Day: **SATURDAY**.
  - Fallback Review Day: **TUESDAY**.
  - Automated Red Alert generated if Tuesday review is also missed.
- **Meeting Minutes**: Tracks scheduled date, actual date, participants, goals reviewed, decisions taken, and accountable action items.

### 🔄 5. Google Calendar API Two-Way Synchronization
- OAuth 2.0 integration for connecting Google accounts.
- Incremental synchronization for task deadlines, candidate interviews, Saturday review cadences, coworking site visits, and product milestones.
- Conflict detection, event ID mapping, and built-in offline simulation mode.

### 📑 6. Multi-Format Report Generation & Export
- **Full Excel Workbook (`.xlsx`)**: Multi-sheet report generated server-side via `openpyxl` with tabs for Goals, Activities, Candidates, Coworking proposals, and Product milestones.
- **Executive Briefing (`.pdf`)**: Printable executive briefing generated server-side via `ReportLab`.
- **Standardized CSV Exports**: For Activities, Candidates, and Coworking spaces.

---

## 2. Technology Stack

- **Backend**: Python 3.12, FastAPI, SQLAlchemy 2.0 (async), Pydantic v2, Uvicorn, Passlib (Bcrypt 4.0), ReportLab, openpyxl, aiosqlite, asyncpg.
- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React, Recharts, Vite.
- **Database**: SQLite (local development in `backend/mes.db`) &rarr; PostgreSQL (production).
- **Design Language**: Premium corporate SaaS inspired by Linear, Asana, and Notion (light `#F8FAFC` background, deep navy `#0F172A`, subtle teal `#0D9488` accents).

---

## 3. Quick Start (Windows CMD & PowerShell)

### Step 1: Launch Backend Server
The backend is configured to automatically serve the production-compiled frontend at `http://localhost:8000/`.

```powershell
# Navigate to the backend directory
cd d:\Management\Management_Execution_System\management-execution-system\backend

# Activate virtual environment
.\.venv312\Scripts\Activate.ps1

# Run API server
python run.py
```

Open your browser to:
- **Application Dashboard**: [http://localhost:8000/](http://localhost:8000/)
- **Interactive OpenAPI Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative ReDoc Documentation**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

### Step 2: (Optional) Frontend Development Server
If developing frontend components with Hot Module Reloading (HMR):

```powershell
cd d:\Management\Management_Execution_System\management-execution-system\frontend
npm run dev
```
*Frontend dev server runs at `http://localhost:5173` with automatic API proxying to port 8000.*

---

## 4. Pre-Configured Demo Accounts (1-Click Login)

The login screen features instant 1-click persona switching:

| Persona | Name | Role | Email | Password | Responsibility |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CEO / Executive** | Dr. Rajesh Varma | `management` | `ceo@mes.local` | `admin123` | Executive oversight & Saturday reviews |
| **HR / Talent Head** | Sneha Kulkarni | `goal_owner` | `hr.lead@mes.local` | `demo123` | **Goal 01 Owner**: Hiring & Talent |
| **Expansion Lead** | Vikramaditya Mehta | `goal_owner` | `expansion.lead@mes.local` | `demo123` | **Goal 02 Owner**: Ahmedabad & Bangalore |
| **Product Head** | Ananya Sen | `goal_owner` | `product.lead@mes.local` | `demo123` | **Goal 03 Owner**: PMS / CAT II AIF |
| **Senior Analyst** | Maitwayi Nandi | `team_member` | `maitwayi@mes.local` | `demo123` | Market research & task execution |
| **System Admin** | Admin Account | `admin` | `admin@mes.local` | `admin123` | RBAC & system settings |

---

## 5. Verification & Testing

ExecFlow includes a comprehensive automated test suite verifying all 13 core modules:

```powershell
cd d:\Management\Management_Execution_System\management-execution-system\backend
.\.venv312\Scripts\Activate.ps1
python test_api_suite.py
```

### Test Suite Results:
```
========================================
   ExecFlow Automated API Test Suite   
========================================
[1/13] Testing Health & Root Endpoints...             ✓ Passed
[2/13] Testing Authentication & JWT Generation...     ✓ Passed
[3/13] Testing Executive Dashboard & 7 Charts...      ✓ Passed
[4/13] Testing Goals Master (G01, G02, G03)...        ✓ Passed
[5/13] Testing Activities & RAG Calculation...        ✓ Passed
[6/13] Testing Weekly Reviews & Saturday Cadence...   ✓ Passed
[7/13] Testing Hiring Management...                   ✓ Passed
[8/13] Testing Expansion (Ahmedabad & Bangalore)...   ✓ Passed
[9/13] Testing Product Development (PMS / CAT II)...  ✓ Passed
[10/13] Testing Calendar Events & Google Sync...      ✓ Passed
[11/13] Testing Notification Engine...                ✓ Passed
[12/13] Testing Reports Export (Excel, CSV, PDF)...   ✓ Passed
[13/13] Testing Audit Trail...                        ✓ Passed
========================================
   ALL 13 BACKEND TEST SUITES PASSED!   
========================================
```

Frontend compilation verification:
```
✓ 2249 modules transformed.
✓ built in 21.73s with 0 errors.
```

---

## 6. Architecture & Specification References

- [PROJECT_ANALYSIS.md](file:///d:/Management/Management_Execution_System/management-execution-system/PROJECT_ANALYSIS.md): Initial codebase inspection, gap analysis, and requirements baseline.
- [IMPLEMENTATION_PLAN.md](file:///d:/Management/Management_Execution_System/management-execution-system/IMPLEMENTATION_PLAN.md): End-to-end phased development architecture and tech stack choices.
- [DATABASE_SCHEMA.md](file:///d:/Management/Management_Execution_System/management-execution-system/DATABASE_SCHEMA.md): Complete relational database schema documentation across all 19 entities.
- [FEATURE_CHECKLIST.md](file:///d:/Management/Management_Execution_System/management-execution-system/FEATURE_CHECKLIST.md): Verification matrix tracking every feature requirement.
- [LOCAL_INSTALLATION_GUIDE.md](file:///d:/Management/Management_Execution_System/management-execution-system/LOCAL_INSTALLATION_GUIDE.md): Detailed local installation guide for Windows CMD & PowerShell.
- [GOOGLE_OAUTH_SETUP.md](file:///d:/Management/Management_Execution_System/management-execution-system/GOOGLE_OAUTH_SETUP.md): Step-by-step Google Cloud Console OAuth 2.0 configuration guide.
- [DEPLOYMENT_GUIDE.md](file:///d:/Management/Management_Execution_System/management-execution-system/DEPLOYMENT_GUIDE.md): Production deployment guide covering Docker, PostgreSQL, Nginx, and SSL.
