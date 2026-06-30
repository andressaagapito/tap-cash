from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.i18n.keys import (
    EMAIL_ALREADY_REGISTERED,
    INVALID_CREDENTIALS,
    RECOVERY_PHRASE_INVALID,
    PASSWORD_WEAK,
    TOKEN_EXPIRED,
)
from app.models.user import User
from app.models.user import User as UserModel
from app.schemas.auth import (
    TokenResponse,
    UserLogin,
    UserRegister,
    UserResponse,
    ForgotPasswordValidate,
    ResetPassword,
    UserProfileUpdate,
)
from app.utils.security import create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
def register(data: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(UserModel).filter(UserModel.email == data.email).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=EMAIL_ALREADY_REGISTERED)

    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)
    user = UserModel(
        name=data.name,
        last_name=data.last_name,
        email=data.email,
        password_hash=hash_password(data.password),
        recovery_phrase_hash=hash_password(data.recovery_phrase),
        password_updated_at=now,
        recovery_phrase_updated_at=now,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.uuid)})
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=INVALID_CREDENTIALS,
        )

    token = create_access_token({"sub": str(user.uuid)})
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/profile", response_model=UserResponse)
def update_profile(
    data: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)

    if data.name is not None:
        current_user.name = data.name
    if data.last_name is not None:
        current_user.last_name = data.last_name
    if data.email is not None:
        if data.email != current_user.email:
            existing = db.query(UserModel).filter(UserModel.email == data.email).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=EMAIL_ALREADY_REGISTERED,
                )
            current_user.email = data.email
    if data.recovery_phrase is not None:
        current_user.recovery_phrase_hash = hash_password(data.recovery_phrase)
        current_user.recovery_phrase_updated_at = now
    if data.password is not None:
        current_user.password_hash = hash_password(data.password)
        current_user.password_updated_at = now

    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/forgot-password/validate")
def forgot_password_validate(
    data: ForgotPasswordValidate,
    db: Session = Depends(get_db)
):
    from datetime import datetime, timezone, timedelta
    import secrets

    user = db.query(UserModel).filter(UserModel.email == data.email).first()

    # Verify recovery phrase. If user not found, or has no recovery phrase, or mismatch, raise error.
    if not user or not user.recovery_phrase_hash or not verify_password(data.recovery_phrase, user.recovery_phrase_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=RECOVERY_PHRASE_INVALID,
        )

    # Generate temporary token (valid for 10 minutes)
    token = secrets.token_urlsafe(32)
    user.password_reset_token_hash = hash_password(token)
    user.password_reset_expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    db.commit()

    return {"recovery_token": token}



@router.post("/reset-password")
def reset_password(
    data: ResetPassword,
    db: Session = Depends(get_db)
):
    import re
    from datetime import datetime, timezone

    # 1. Validate password strength
    password = data.new_password
    if (
        len(password) < 8
        or not re.search(r"[A-Z]", password)
        or not re.search(r"[a-z]", password)
        or not re.search(r"\d", password)
        or not re.search(r"[!@#$%^&*(),.?\":{}|<>]", password)
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=PASSWORD_WEAK,
        )

    # 2. Get user
    user = db.query(UserModel).filter(UserModel.email == data.email).first()

    # 3. Validate token existence
    if not user or not user.password_reset_token_hash or not user.password_reset_expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=TOKEN_EXPIRED,
        )

    # 4. Check expiration
    now = datetime.now(timezone.utc)
    if user.password_reset_expires_at < now:
        # Clear token even on expired attempt to be secure
        user.password_reset_token_hash = None
        user.password_reset_expires_at = None
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=TOKEN_EXPIRED,
        )

    # 5. Verify token correctness
    if not verify_password(data.recovery_token, user.password_reset_token_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=TOKEN_EXPIRED,
        )

    # 6. Update password and invalidate token
    user.password_hash = hash_password(password)
    user.password_updated_at = datetime.now(timezone.utc)
    user.password_reset_token_hash = None
    user.password_reset_expires_at = None
    db.commit()

    return {"detail": "Password reset successfully"}

