from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.financial_profile import UserFinancialProfile
from app.models.user import User
from app.schemas.financial_profile import FinancialProfileResponse, FinancialProfileUpdate

router = APIRouter(prefix="/financial-profile", tags=["Financial Profile"])


@router.get("", response_model=FinancialProfileResponse)
def get_financial_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = (
        db.query(UserFinancialProfile)
        .filter(UserFinancialProfile.user_id == current_user.id)
        .first()
    )
    if not profile:
        profile = UserFinancialProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile


@router.put("", response_model=FinancialProfileResponse)
def update_financial_profile(
    data: FinancialProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = (
        db.query(UserFinancialProfile)
        .filter(UserFinancialProfile.user_id == current_user.id)
        .first()
    )
    if not profile:
        profile = UserFinancialProfile(
            user_id=current_user.id,
            monthly_salary=data.monthly_salary or 0,
            auto_mark_installments_paid=data.auto_mark_installments_paid or False,
        )
        db.add(profile)
    else:
        if data.monthly_salary is not None:
            profile.monthly_salary = data.monthly_salary
        if data.auto_mark_installments_paid is not None:
            profile.auto_mark_installments_paid = data.auto_mark_installments_paid
    db.commit()
    db.refresh(profile)
    return profile
