from datetime import timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, status, Response
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.config import settings
from app.database.session import get_db
from app.models.user import User
from app.schemas.user import Token, UserCreate, UserResponse
from app.auth.security import verify_password, get_password_hash, create_access_token
from app.auth.deps import get_current_user

router = APIRouter()

class SetPasswordRequest(BaseModel):
    token: str
    new_password: str

@router.post("/login", response_model=Token)
def login_access_token(
    response: Response,
    db: Session = Depends(get_db), 
    form_data: OAuth2PasswordRequestForm = Depends()
):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not user.hashed_password:
        # Account exists but password not yet set
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account not yet activated. Please set your password using the link sent to your email.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role}, expires_delta=access_token_expires
    )
    
    # Set HTTP-only secure cookie for authentication
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        path="/"
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/logout")
def logout(response: Response):
    """Clear HTTP-only access_token authentication cookie."""
    response.delete_cookie(key="access_token", path="/")
    return {"message": "Logged out successfully"}

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/set-password")
def set_password(data: SetPasswordRequest, db: Session = Depends(get_db)):
    """Patient activates their account by setting a password via the emailed token."""
    user = db.query(User).filter(User.reset_token == data.token).first()

    if not user:
        raise HTTPException(
            status_code=400, 
            detail="This link has already been used to activate your account or is invalid. If you already set your password, please log in."
        )

    if user.reset_token_expires and datetime.utcnow() > user.reset_token_expires:
        raise HTTPException(
            status_code=400, 
            detail="This activation link has expired (48-hour limit). Please contact your clinic to request a new link."
        )

    if len(data.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    user.hashed_password = get_password_hash(data.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    user.require_password_change = False
    db.commit()

    return {"message": "Password set successfully. You can now log in to the patient portal."}

@router.get("/verify-token/{token}")
def verify_reset_token(token: str, db: Session = Depends(get_db)):
    """Verify if a reset token is valid before showing the set-password form."""
    user = db.query(User).filter(User.reset_token == token).first()
    if not user:
        raise HTTPException(
            status_code=400, 
            detail="This activation link has already been used or is invalid."
        )
    if user.reset_token_expires and datetime.utcnow() > user.reset_token_expires:
        raise HTTPException(
            status_code=400, 
            detail="This activation link has expired (48-hour limit)."
        )
    return {"valid": True, "username": user.username}

