from sqlalchemy import func
from sqlalchemy.orm import Session

from app.constants.categories import is_builtin_category
from app.models.user_category import UserCategory


def ensure_user_category(db: Session, user_id: int, category_name: str) -> UserCategory | None:
    name = category_name.strip()
    if not name or is_builtin_category(name):
        return None

    existing = (
        db.query(UserCategory)
        .filter(
            UserCategory.user_id == user_id,
            func.lower(UserCategory.name) == name.lower(),
        )
        .first()
    )
    if existing:
        return existing

    category = UserCategory(user_id=user_id, name=name)
    db.add(category)
    return category
