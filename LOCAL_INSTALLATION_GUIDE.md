# ExecFlow — Local Installation & Execution Guide (Windows 10/11)

This guide provides tested, step-by-step instructions for running **ExecFlow — Management Execution System** on Windows 10/11 using standard Command Prompt (CMD) or PowerShell.

---

## 1. System Requirements

- **Operating System**: Windows 10 or Windows 11 (64-bit)
- **Python**: Version 3.11 or 3.12 (Python 3.12 recommended)
- **Node.js**: Version 18.x or 20.x+ with `npm`
- **Git** (optional)

---

## 2. Directory Structure

```
d:\Management\Management_Execution_System\management-execution-system\
├── backend\
│   ├── app\               # FastAPI application, SQLAlchemy models, API routers
│   ├── scripts\           # Database seeding & migration scripts
│   ├── uploads\           # Uploaded documents and candidate CVs
│   ├── mes.db             # Local SQLite database (pre-seeded)
│   ├── requirements.txt   # Python dependencies
│   ├── run.py             # Uvicorn launcher
│   └── test_api_suite.py  # 13 automated API test suites
├── frontend\
│   ├── src\               # React 18, TypeScript, Tailwind CSS, Lucide, Recharts
│   ├── dist\              # Production compiled bundle (ready for serving)
│   ├── package.json       # Frontend dependencies
│   └── vite.config.ts     # Vite build and backend proxy configuration
├── GOOGLE_OAUTH_SETUP.md  # Google Calendar API configuration
├── DATABASE_SCHEMA.md     # Relational schema reference
├── IMPLEMENTATION_PLAN.md # Strategic architecture specification
└── README.md              # Project overview
```

---

## 3. Quick Start (Single Command Launch)

The backend is configured to automatically serve the production-compiled frontend bundle at `http://localhost:8000/`.

### PowerShell:
```powershell
# Navigate to the backend directory
cd d:\Management\Management_Execution_System\management-execution-system\backend

# Activate virtual environment
.\.venv312\Scripts\Activate.ps1

# Start the application server
python run.py
```

### Command Prompt (CMD):
```cmd
cd /d d:\Management\Management_Execution_System\management-execution-system\backend
.\.venv312\Scripts\activate.bat
python run.py
```

Open your browser to:
- **Application UI**: [http://localhost:8000/](http://localhost:8000/)
- **Interactive API Documentation (Swagger)**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative API Documentation (ReDoc)**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 4. Fresh Setup from Scratch (If reinstalling)

### Step 4.1: Setup Python Backend
```powershell
cd d:\Management\Management_Execution_System\management-execution-system\backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
.\.venv\Scripts\Activate.ps1

# Upgrade pip
python -m pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

# Seed the database with realistic demo data
python -m scripts.seed_demo_data
```

### Step 4.2: Setup React Frontend
```powershell
cd d:\Management\Management_Execution_System\management-execution-system\frontend

# Install npm dependencies
npm install

# Build production bundle
npm run build
```

---

## 5. Development Mode (Hot Reloading)

If you are developing frontend components and want instant Hot Module Reloading (HMR):

### Terminal 1 — Start Backend Server:
```powershell
cd d:\Management\Management_Execution_System\management-execution-system\backend
.\.venv312\Scripts\Activate.ps1
python run.py
```
*Backend runs at `http://localhost:8000`*

### Terminal 2 — Start Frontend Dev Server:
```powershell
cd d:\Management\Management_Execution_System\management-execution-system\frontend
npm run dev
```
*Frontend runs at `http://localhost:5173` and automatically proxies all `/api` and `/uploads` requests to the backend.*

---

## 6. Pre-Configured Demo Accounts

You can log in directly from the login screen using the **1-Click Demo Login** persona buttons, or enter the credentials manually:

| Persona | Name | Role | Email | Password | Primary Responsibility |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CEO / Executive** | Dr. Rajesh Varma | `management` | `ceo@mes.local` | `admin123` | Full enterprise oversight, Saturday reviews |
| **HR / Talent Head** | Sneha Kulkarni | `goal_owner` | `hr.lead@mes.local` | `demo123` | **Goal 01**: Hiring & Talent Acquisition |
| **Expansion Lead** | Vikramaditya Mehta | `goal_owner` | `expansion.lead@mes.local` | `demo123` | **Goal 02**: Ahmedabad & Bangalore Offices |
| **Product Head** | Ananya Sen | `goal_owner` | `product.lead@mes.local` | `demo123` | **Goal 03**: PMS & CAT II AIF Development |
| **Senior Analyst** | Maitwayi Nandi | `team_member` | `maitwayi@mes.local` | `demo123` | Activity execution, market research |
| **BD Specialist** | Karan Patel | `team_member` | `karan.bd@mes.local` | `demo123` | Ahmedabad coworking & client outreach |
| **Recruitment Lead** | Pooja Shah | `team_member` | `pooja.talent@mes.local` | `demo123` | Agency follow-ups & screening calls |
| **System Admin** | Admin Account | `admin` | `admin@mes.local` | `admin123` | System settings, user invites, RBAC |

---

## 7. Running Automated Test Suites

To verify that all API endpoints, database relationships, and file export services are functioning correctly:

```powershell
cd d:\Management\Management_Execution_System\management-execution-system\backend
.\.venv312\Scripts\Activate.ps1
python test_api_suite.py
```

Expected output:
```
========================================
   ALL 13 BACKEND TEST SUITES PASSED!   
========================================
```
