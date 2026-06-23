from datetime import date
from decimal import Decimal, ROUND_UP

from dateutil.relativedelta import relativedelta

from app.models.goal import Goal, GoalOption, GoalStatus


def months_until_deadline(deadline: date | None, reference: date | None = None) -> int | None:
    if not deadline:
        return None
    today = reference or date.today()
    if deadline <= today:
        return 0
    delta = relativedelta(deadline.replace(day=1), today.replace(day=1))
    months = delta.years * 12 + delta.months
    if deadline.day > today.day or months == 0:
        months += 1
    return max(months, 1)


def calculate_goal_metrics(goal: Goal, reference: date | None = None) -> dict:
    today = reference or date.today()
    target = goal.target_amount
    saved = goal.saved_amount

    if goal.status == GoalStatus.COMPLETED:
        remaining = Decimal("0")
        progress_percent = Decimal("100")
    else:
        remaining = max(target - saved, Decimal("0"))
        progress_percent = (
            min((saved / target) * Decimal("100"), Decimal("100"))
            if target > 0
            else Decimal("0")
        )

    months = months_until_deadline(goal.deadline, today)
    monthly_savings_needed = None
    if months is not None and months > 0 and remaining > 0:
        monthly_savings_needed = (remaining / Decimal(months)).quantize(Decimal("0.01"))
    elif remaining == 0:
        monthly_savings_needed = Decimal("0")

    estimated_completion_date = None
    if goal.status == GoalStatus.COMPLETED or remaining == 0:
        estimated_completion_date = today
    elif goal.deadline and monthly_savings_needed is not None:
        estimated_completion_date = goal.deadline
    elif monthly_savings_needed and monthly_savings_needed > 0:
        months_needed = int((remaining / monthly_savings_needed).to_integral_value(rounding=ROUND_UP))
        estimated_completion_date = today + relativedelta(months=max(months_needed, 1))

    on_track = None
    if goal.deadline and monthly_savings_needed is not None and remaining > 0:
        on_track = months is not None and months > 0

    return {
        "progress_percent": progress_percent,
        "remaining_amount": remaining,
        "monthly_savings_needed": monthly_savings_needed,
        "estimated_completion_date": estimated_completion_date,
        "months_until_deadline": months,
        "on_track": on_track,
    }


def analyze_option(option: GoalOption, goal: Goal, metrics: dict) -> dict:
    saved = goal.saved_amount
    estimated = option.estimated_amount
    gap_from_saved = max(estimated - saved, Decimal("0"))
    gap_from_target = max(estimated - goal.target_amount, Decimal("0"))
    months = metrics.get("months_until_deadline")
    monthly_for_option = None
    if months and months > 0 and gap_from_saved > 0:
        monthly_for_option = (gap_from_saved / Decimal(months)).quantize(Decimal("0.01"))

    affordable_now = saved >= estimated
    fits_target = estimated <= goal.target_amount

    return {
        "gap_from_saved": gap_from_saved,
        "gap_from_target": gap_from_target,
        "monthly_savings_for_option": monthly_for_option,
        "affordable_now": affordable_now,
        "fits_target": fits_target,
        "meets_goal_with_current_savings": saved >= goal.target_amount,
    }


def build_option_comparison(goal: Goal, options: list[GoalOption], metrics: dict) -> list[dict]:
    comparison = []
    for option in options:
        analysis = analyze_option(option, goal, metrics)
        comparison.append(
            {
                "option_id": option.id,
                "name": option.name,
                "estimated_amount": option.estimated_amount,
                "status": option.status,
                **analysis,
            }
        )
    comparison.sort(key=lambda item: item["estimated_amount"])
    return comparison
