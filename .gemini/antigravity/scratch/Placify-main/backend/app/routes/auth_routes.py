from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import datetime
try:
    from ..database import get_db
    from ..models import UserRegister, UserLogin, DBUser
    from ..services.auth import get_password_hash, verify_password, create_access_token
except (ImportError, ValueError):
    from database import get_db
    from models import UserRegister, UserLogin, DBUser
    from services.auth import get_password_hash, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/signup")
def signup(user_data: UserRegister, db: Session = Depends(get_db)):
    """User registration handler"""
    # Check if email is already taken
    existing_user = db.query(DBUser).filter(DBUser.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="An account with this email address already exists."
        )
    
    # Hash password and create record
    hashed_pwd = get_password_hash(user_data.password)
    new_user = DBUser(
        email=user_data.email,
        password_hash=hashed_pwd,
        role=user_data.role
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Generate token
    token = create_access_token({"sub": new_user.email, "role": new_user.role, "id": new_user.id})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "email": new_user.email,
        "role": new_user.role
    }

@router.post("/login")
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """User authentication verification handler"""
    user = db.query(DBUser).filter(DBUser.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Verify your email and password."
        )
    
    # Generate token
    token = create_access_token({"sub": user.email, "role": user.role, "id": user.id})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "email": user.email,
        "role": user.role
    }
