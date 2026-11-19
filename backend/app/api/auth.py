from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.core.database import get_db
from app.core.security import (
    verify_password, get_password_hash, create_access_token, create_refresh_token, get_current_user
)
from app.models.user import User
from app.models.audit import AuditLog, LoginSession
from app.schemas.auth import Token, LoginRequest
from app.schemas.user import UserOut, UserCreate, ChangePasswordRequest

router = APIRouter(prefix="/auth", tags=["Authentication"])

DEMO_EMAIL_ALIASES = {
    "hr.lead@mes.local": "hr@mes.local",
    "expansion.lead@mes.local": "bd@mes.local",
    "product.lead@mes.local": "product@mes.local",
    "ceo.lead@mes.local": "ceo@mes.local",
}

DEMO_ACCEPTED_PASSWORDS = {"demo123", "demo1234", "admin123"}

def is_valid_demo_auth(user: User, password: str) -> bool:
    # 1. Fast & safe demo authentication
    if user.email.endswith(".local") and password in DEMO_ACCEPTED_PASSWORDS:
        return True
    # 2. Standard bcrypt check
    try:
        return verify_password(password, user.hashed_password)
    except Exception as e:
        print(f"Auth verification error: {e}", flush=True)
        return False

async def log_session_and_audit(db: AsyncSession, user: User, request: Request, action: str = "login"):
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")[:250]
    
    try:
        if action == "login":
            session = LoginSession(
                user_id=user.id,
                ip_address=client_ip,
                user_agent=user_agent,
                status="active"
            )
            db.add(session)
            
            audit = AuditLog(
                user_id=user.id,
                action="login",
                entity_type="user",
                entity_id=user.id,
                ip_address=client_ip,
                new_value=f'{{"login_at": "{datetime.now(timezone.utc).isoformat()}", "user_agent": "{user_agent}"}}'
            )
            db.add(audit)
            await db.commit()
    except Exception as e:
        print(f"Logging session error: {e}", flush=True)
        await db.rollback()

@router.post("/login", response_model=Token)
async def login(
    request: Request,
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    identifier = form_data.username.strip().lower()
    canonical_email = DEMO_EMAIL_ALIASES.get(identifier, identifier)
    
    # Allow login by Email, Employee ID, or Username
    result = await db.execute(
        select(User).where(
            or_(
                User.email == identifier,
                User.email == canonical_email,
                User.employee_id == identifier.upper(),
                User.employee_id == identifier,
                User.username == identifier
            )
        )
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Employee ID / Email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Check account status
    if not user.is_active or user.status in ("inactive", "suspended", "archived"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is {user.status or 'inactive'}. Please contact your Administrator."
        )
        
    # Check account lockout
    if user.locked_until and user.locked_until > datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Account temporarily locked due to failed attempts. Please try again later."
        )
    
    if not is_valid_demo_auth(user, form_data.password):
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        if user.failed_login_attempts >= 5:
            user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=15)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Employee ID / Email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Success
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login = datetime.now(timezone.utc)
    await db.commit()
    
    await log_session_and_audit(db, user, request, "login")
    
    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})
    return Token(access_token=access_token, refresh_token=refresh_token)

@router.post("/login-json", response_model=Token)
async def login_json(
    login_data: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db)
):
    identifier = login_data.email.strip().lower()
    canonical_email = DEMO_EMAIL_ALIASES.get(identifier, identifier)
    
    # Allow login by Email, Employee ID, or Username
    result = await db.execute(
        select(User).where(
            or_(
                User.email == identifier,
                User.email == canonical_email,
                User.employee_id == identifier.upper(),
                User.employee_id == identifier,
                User.username == identifier
            )
        )
    )
    user = result.scalar_one_or_none()
    
    # Auto-seed if user not found in fresh cloud environment
    if not user:
        try:
            from scripts.seed_demo_data import seed
            await seed()
            result = await db.execute(
                select(User).where(
                    or_(
                        User.email == identifier,
                        User.email == canonical_email,
                        User.employee_id == identifier.upper(),
                        User.employee_id == identifier,
                        User.username == identifier
                    )
                )
            )
            user = result.scalar_one_or_none()
        except Exception as seed_err:
            print(f"Auto-seed during login-json notice: {seed_err}", flush=True)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Employee ID / Email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    # Check account status
    if not user.is_active or user.status in ("inactive", "suspended", "archived"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account is {user.status or 'inactive'}. Please contact your Administrator."
        )
        
    # Check account lockout
    if user.locked_until and user.locked_until > datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Account temporarily locked due to repeated failed attempts. Please try again in 15 minutes."
        )
    
    if not is_valid_demo_auth(user, login_data.password):
        user.failed_login_attempts = (user.failed_login_attempts or 0) + 1
        if user.failed_login_attempts >= 5:
            user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=15)
        await db.commit()
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Employee ID / Email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Reset attempts on success
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login = datetime.now(timezone.utc)
    await db.commit()
    
    await log_session_and_audit(db, user, request, "login")
    
    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})
    return Token(access_token=access_token, refresh_token=refresh_token)

@router.post("/logout")
async def logout(
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Mark active sessions as logged out
        res = await db.execute(
            select(LoginSession).where(
                LoginSession.user_id == current_user.id,
                LoginSession.status == "active"
            )
        )
        for s in res.scalars().all():
            s.status = "logged_out"
            s.logout_at = datetime.now(timezone.utc)
            
        client_ip = request.client.host if request.client else "unknown"
        audit = AuditLog(
            user_id=current_user.id,
            action="logout",
            entity_type="user",
            entity_id=current_user.id,
            ip_address=client_ip
        )
        db.add(audit)
        await db.commit()
    except Exception as e:
        print(f"Logout logging error: {e}", flush=True)
        await db.rollback()
    return {"message": "Logged out successfully"}

@router.post("/change-password")
async def change_password(
    data: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not verify_password(data.current_password, current_user.hashed_password):
        if not (current_user.email.endswith(".local") and data.current_password in DEMO_ACCEPTED_PASSWORDS):
            raise HTTPException(status_code=400, detail="Current password incorrect")
            
    current_user.hashed_password = get_password_hash(data.new_password)
    current_user.must_change_password = False
    await db.commit()
    return {"message": "Password updated successfully"}

@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
