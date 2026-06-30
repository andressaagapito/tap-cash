from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.constants.categories import is_builtin_category
from app.database import get_db
from app.dependencies import get_current_user
from app.i18n.keys import CATEGORY_ALREADY_EXISTS, CATEGORY_NOT_FOUND
from app.models.user import User
from app.models.user_category import UserCategory
from app.schemas.category import CategoryCreate, CategoryResponse
from app.services.category import ensure_user_category

router = APIRouter(prefix="/categories", tags=["Categories"])


def _get_user_category(db: Session, category_uuid: UUID, user_id: int) -> UserCategory:
    category = (
        db.query(UserCategory)
        .filter(UserCategory.uuid == category_uuid, UserCategory.user_id == user_id)
        .first()
    )
    if not category:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=CATEGORY_NOT_FOUND)
    return category


@router.get("", response_model=list[CategoryResponse])
def list_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(UserCategory)
        .filter(UserCategory.user_id == current_user.id)
        .order_by(UserCategory.name)
        .all()
    )


@router.post("", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(
    data: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    name = data.name.strip()
    if is_builtin_category(name):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=CATEGORY_ALREADY_EXISTS)

    existing = (
        db.query(UserCategory)
        .filter(
            UserCategory.user_id == current_user.id,
            func.lower(UserCategory.name) == name.lower(),
        )
        .first()
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=CATEGORY_ALREADY_EXISTS)

    category = ensure_user_category(db, current_user.id, name)
    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_uuid}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_uuid: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    category = _get_user_category(db, category_uuid, current_user.id)
    db.delete(category)
    db.commit()
