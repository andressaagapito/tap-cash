from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import get_current_user
from app.i18n.keys import GOAL_NOT_FOUND, GOAL_OPTION_NOT_FOUND
from app.models.goal import Goal, GoalOption, GoalStatus
from app.models.user import User
from app.schemas.goal import (
    GoalAnalysis,
    GoalCreate,
    GoalDetailResponse,
    GoalOptionComparison,
    GoalOptionCreate,
    GoalOptionResponse,
    GoalOptionUpdate,
    GoalResponse,
    GoalUpdate,
)
from app.services.goal_calculator import (
    analyze_option,
    build_option_comparison,
    calculate_goal_metrics,
)

router = APIRouter(prefix="/goals", tags=["Goals"])


def _goal_query(db: Session, user_id: int):
    return (
        db.query(Goal)
        .options(joinedload(Goal.options))
        .filter(Goal.user_id == user_id)
    )


def _get_user_goal(db: Session, goal_id: int, user_id: int) -> Goal:
    goal = _goal_query(db, user_id).filter(Goal.id == goal_id).first()
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=GOAL_NOT_FOUND)
    return goal


def _get_user_option(db: Session, goal_id: int, option_id: int, user_id: int) -> GoalOption:
    goal = _get_user_goal(db, goal_id, user_id)
    option = next((item for item in goal.options if item.id == option_id), None)
    if not option:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=GOAL_OPTION_NOT_FOUND)
    return option


def _auto_complete_goal(goal: Goal) -> None:
    if goal.saved_amount >= goal.target_amount and goal.status == GoalStatus.ACTIVE:
        goal.status = GoalStatus.COMPLETED


def _goal_to_response(goal: Goal) -> GoalResponse:
    metrics = calculate_goal_metrics(goal)
    return GoalResponse(
        id=goal.id,
        user_id=goal.user_id,
        name=goal.name,
        description=goal.description,
        target_amount=goal.target_amount,
        saved_amount=goal.saved_amount,
        deadline=goal.deadline,
        priority=goal.priority,
        category=goal.category,
        status=goal.status,
        created_at=goal.created_at,
        updated_at=goal.updated_at,
        progress_percent=metrics["progress_percent"],
        remaining_amount=metrics["remaining_amount"],
        monthly_savings_needed=metrics["monthly_savings_needed"],
        estimated_completion_date=metrics["estimated_completion_date"],
        months_until_deadline=metrics["months_until_deadline"],
        options_count=len(goal.options),
    )


def _option_to_response(option: GoalOption, goal: Goal, metrics: dict) -> GoalOptionResponse:
    analysis = analyze_option(option, goal, metrics)
    return GoalOptionResponse(
        id=option.id,
        goal_id=option.goal_id,
        name=option.name,
        estimated_amount=option.estimated_amount,
        description=option.description,
        reference_link=option.reference_link,
        status=option.status,
        created_at=option.created_at,
        gap_from_saved=analysis["gap_from_saved"],
        gap_from_target=analysis["gap_from_target"],
        monthly_savings_for_option=analysis["monthly_savings_for_option"],
        affordable_now=analysis["affordable_now"],
        fits_target=analysis["fits_target"],
    )


def _build_savings_suggestion(metrics: dict) -> str | None:
    monthly = metrics.get("monthly_savings_needed")
    if monthly is None:
        return None
    if monthly <= 0:
        return "goal_suggestion_completed"
    months = metrics.get("months_until_deadline")
    if months is not None and months > 0:
        return "goal_suggestion_monthly_deadline"
    return "goal_suggestion_monthly_open"


@router.get("", response_model=list[GoalResponse])
def list_goals(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goals = _goal_query(db, current_user.id).order_by(Goal.created_at.desc()).all()
    return [_goal_to_response(goal) for goal in goals]


@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
def create_goal(
    data: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = Goal(user_id=current_user.id, **data.model_dump())
    _auto_complete_goal(goal)
    db.add(goal)
    db.commit()
    db.refresh(goal)
    goal = _get_user_goal(db, goal.id, current_user.id)
    return _goal_to_response(goal)


@router.get("/{goal_id}", response_model=GoalDetailResponse)
def get_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = _get_user_goal(db, goal_id, current_user.id)
    metrics = calculate_goal_metrics(goal)
    base = _goal_to_response(goal).model_dump()
    options = [_option_to_response(option, goal, metrics) for option in goal.options]
    comparison = [GoalOptionComparison(**item) for item in build_option_comparison(goal, goal.options, metrics)]
    analysis = GoalAnalysis(
        progress_percent=metrics["progress_percent"],
        remaining_amount=metrics["remaining_amount"],
        monthly_savings_needed=metrics["monthly_savings_needed"],
        estimated_completion_date=metrics["estimated_completion_date"],
        months_until_deadline=metrics["months_until_deadline"],
        on_track=metrics["on_track"],
        savings_suggestion=_build_savings_suggestion(metrics),
    )
    return GoalDetailResponse(**base, options=options, option_comparison=comparison, analysis=analysis)


@router.put("/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: int,
    data: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = _get_user_goal(db, goal_id, current_user.id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(goal, field, value)
    _auto_complete_goal(goal)
    db.commit()
    goal = _get_user_goal(db, goal_id, current_user.id)
    return _goal_to_response(goal)


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = _get_user_goal(db, goal_id, current_user.id)
    db.delete(goal)
    db.commit()


@router.post("/{goal_id}/options", response_model=GoalOptionResponse, status_code=status.HTTP_201_CREATED)
def create_option(
    goal_id: int,
    data: GoalOptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = _get_user_goal(db, goal_id, current_user.id)
    option = GoalOption(goal_id=goal.id, **data.model_dump())
    db.add(option)
    db.commit()
    db.refresh(option)
    metrics = calculate_goal_metrics(goal)
    return _option_to_response(option, goal, metrics)


@router.put("/{goal_id}/options/{option_id}", response_model=GoalOptionResponse)
def update_option(
    goal_id: int,
    option_id: int,
    data: GoalOptionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    goal = _get_user_goal(db, goal_id, current_user.id)
    option = _get_user_option(db, goal_id, option_id, current_user.id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(option, field, value)
    db.commit()
    db.refresh(option)
    metrics = calculate_goal_metrics(goal)
    return _option_to_response(option, goal, metrics)


@router.delete("/{goal_id}/options/{option_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_option(
    goal_id: int,
    option_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    option = _get_user_option(db, goal_id, option_id, current_user.id)
    db.delete(option)
    db.commit()
