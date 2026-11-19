from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import (
    verify_password, get_password_hash, create_access_token, create_refresh_token, get_current_user
)
from app.models.user import User
from app.schemas.auth import Token, LoginRequest
from app.schemas.user import UserOut, UserCreate

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

@router.post("/login", response_model=Token)
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    email = form_data.username.strip().lower()
    canonical_email = DEMO_EMAIL_ALIASES.get(email, email)
    
    result = await db.execute(select(User).where((User.email == email) | (User.email == canonical_email)))
    user = result.scalar_one_or_none()
    
    # Auto-seed if user not found in new cloud environment
    if not user:
        try:
            from scripts.seed_demo_data import seed
            await seed()
            result = await db.execute(select(User).where((User.email == email) | (User.email == canonical_email)))
            user = result.scalar_one_or_none()
        except Exception as seed_err:
            print(f"Auto-seed during login failed: {seed_err}", flush=True)
    
    if not user or not is_valid_demo_auth(user, form_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    try:
        user.last_login = datetime.now(timezone.utc)
        await db.commit()
    except Exception as e:
        print(f"Notice: last_login update skipped: {e}", flush=True)
        await db.rollback()
    
    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})
    return Token(access_token=access_token, refresh_token=refresh_token)

@router.post("/login-json", response_model=Token)
async def login_json(
    login_data: LoginRequest,
    db: AsyncSession = Depends(get_db)
):
    email = login_data.email.strip().lower()
    canonical_email = DEMO_EMAIL_ALIASES.get(email, email)
    
    result = await db.execute(select(User).where((User.email == email) | (User.email == canonical_email)))
    user = result.scalar_one_or_none()
    
    # Auto-seed if user not found in new cloud environment
    if not user:
        try:
            from scripts.seed_demo_data import seed
            await seed()
            result = await db.execute(select(User).where((User.email == email) | (User.email == canonical_email)))
            user = result.scalar_one_or_none()
        except Exception as seed_err:
            print(f"Auto-seed during login-json failed: {seed_err}", flush=True)
    
    if not user or not is_valid_demo_auth(user, login_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    
    try:
        user.last_login = datetime.now(timezone.utc)
        await db.commit()
    except Exception as e:
        print(f"Notice: last_login update skipped: {e}", flush=True)
        await db.rollback()
    
    access_token = create_access_token(data={"sub": user.id})
    refresh_token = create_refresh_token(data={"sub": user.id})
    return Token(access_token=access_token, refresh_token=refresh_token)

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_in.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_in.email,
        hashed_password=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        phone=user_in.phone,
        job_title=user_in.job_title,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user

@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
