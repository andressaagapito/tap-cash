from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.projection import ProjectionResponse
from app.schemas.suggestion import PayoffSuggestion
from app.services.projection import build_projection
from app.services.suggestions import build_payoff_suggestions

projection_router = APIRouter(prefix="/projection", tags=["Projection"])
suggestions_router = APIRouter(prefix="/suggestions", tags=["Suggestions"])


@projection_router.get("", response_model=ProjectionResponse)
def get_projection(
    months: int = Query(12, ge=1, le=36),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return build_projection(db, current_user.id, months)


@suggestions_router.get("/payoff", response_model=list[PayoffSuggestion])
def get_payoff_suggestions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return build_payoff_suggestions(db, current_user.id)
