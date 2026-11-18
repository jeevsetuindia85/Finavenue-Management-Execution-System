from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
import os

from app.core.config import settings
from app.core.database import init_db
from app.api import (
    auth, users, goals, activities, dashboard, reviews,
    hiring, expansion, products, calendar, notifications, reports, audit
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    try:
        from scripts.seed_demo_data import seed
        await seed()
    except Exception as e:
        print(f"Startup seed notice: {e}")
    yield
    # Shutdown
    pass

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="ExecFlow — Management Execution & Goal Tracking SaaS Production API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)
app.include_router(users.router, prefix=settings.API_V1_PREFIX)
app.include_router(goals.router, prefix=settings.API_V1_PREFIX)
app.include_router(activities.router, prefix=settings.API_V1_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_V1_PREFIX)
app.include_router(reviews.router, prefix=settings.API_V1_PREFIX)
app.include_router(hiring.router, prefix=settings.API_V1_PREFIX)
app.include_router(expansion.router, prefix=settings.API_V1_PREFIX)
app.include_router(products.router, prefix=settings.API_V1_PREFIX)
app.include_router(calendar.router, prefix=settings.API_V1_PREFIX)
app.include_router(notifications.router, prefix=settings.API_V1_PREFIX)
app.include_router(reports.router, prefix=settings.API_V1_PREFIX)
app.include_router(audit.router, prefix=settings.API_V1_PREFIX)

# Static file serving for uploads
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "ExecFlow Backend API", "version": settings.APP_VERSION}

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))

@app.get("/")
async def root(request: Request):
    accept = request.headers.get("accept", "")
    # If request is from browser requesting HTML and frontend dist exists, serve the SPA index
    if "text/html" in accept and os.path.exists(os.path.join(frontend_dist, "index.html")):
        return FileResponse(os.path.join(frontend_dist, "index.html"))
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "running",
        "docs": "/docs",
        "endpoints": [
            f"{settings.API_V1_PREFIX}/auth",
            f"{settings.API_V1_PREFIX}/users",
            f"{settings.API_V1_PREFIX}/goals",
            f"{settings.API_V1_PREFIX}/activities",
            f"{settings.API_V1_PREFIX}/dashboard",
            f"{settings.API_V1_PREFIX}/reviews",
            f"{settings.API_V1_PREFIX}/hiring",
            f"{settings.API_V1_PREFIX}/expansion",
            f"{settings.API_V1_PREFIX}/products",
            f"{settings.API_V1_PREFIX}/calendar",
            f"{settings.API_V1_PREFIX}/notifications",
            f"{settings.API_V1_PREFIX}/reports",
            f"{settings.API_V1_PREFIX}/audit",
        ]
    }

# Frontend static serving (SPA fallback)
if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str, request: Request):
        # Do not catch API or docs
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            return JSONResponse(status_code=404, content={"detail": "Not found"})
        
        file_path = os.path.join(frontend_dist, full_path)
        if full_path and os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return JSONResponse(status_code=404, content={"detail": "Frontend not found"})
