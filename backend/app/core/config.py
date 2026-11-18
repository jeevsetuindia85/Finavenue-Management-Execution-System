from pydantic_settings import BaseSettings
from typing import Optional
import os

_backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
_default_db_file = os.path.join(_backend_dir, "mes.db").replace("\\", "/")
_default_db_url = f"sqlite+aiosqlite:///{_default_db_file}"
_default_upload_dir = os.path.join(_backend_dir, "uploads")

class Settings(BaseSettings):
    APP_NAME: str = "Management Execution System"
    APP_VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "execflow-enterprise-production-jwt-key-32chars-min-secure")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 8  # 8 hours
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database (Defaults to absolute path of backend/mes.db)
    DATABASE_URL: str = os.getenv("DATABASE_URL", _default_db_url)
    
    # Google OAuth (placeholders – set in .env)
    GOOGLE_CLIENT_ID: Optional[str] = os.getenv("GOOGLE_CLIENT_ID")
    GOOGLE_CLIENT_SECRET: Optional[str] = os.getenv("GOOGLE_CLIENT_SECRET")
    GOOGLE_REDIRECT_URI: str = os.getenv("GOOGLE_REDIRECT_URI", "http://localhost:8000/api/v1/calendar/oauth/callback")
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:5173", 
        "http://localhost:3000", 
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "http://127.0.0.1:8000"
    ]
    
    # File uploads
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", _default_upload_dir)
    MAX_UPLOAD_SIZE_MB: int = 10
    
    # Email (optional)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    EMAIL_FROM: str = "noreply@mes.local"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
