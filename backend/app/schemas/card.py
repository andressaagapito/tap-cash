import re
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator

ALLOWED_CARD_ICONS = frozenset({
    "credit-card",
    "wallet",
    "banknote",
    "building-2",
    "shopping-bag",
    "plane",
    "car",
    "home",
    "smartphone",
    "gift",
    "heart",
    "star",
})

ALLOWED_CARD_COLORS = frozenset({
    "#3B82F6",
    "#6366F1",
    "#8B5CF6",
    "#EC4899",
    "#EF4444",
    "#F97316",
    "#F59E0B",
    "#22C55E",
    "#14B8A6",
    "#06B6D4",
    "#64748B",
})

DEFAULT_CARD_COLOR = "#3B82F6"
DEFAULT_CARD_ICON = "credit-card"
HEX_COLOR_PATTERN = re.compile(r"^#[0-9A-Fa-f]{6}$")


def _validate_color(value: str) -> str:
    normalized = value.upper()
    if normalized not in ALLOWED_CARD_COLORS:
        raise ValueError("invalid_card_color")
    return normalized


def _validate_icon(value: str) -> str:
    if value not in ALLOWED_CARD_ICONS:
        raise ValueError("invalid_card_icon")
    return value


class CardCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    institution: str = Field(min_length=1, max_length=120)
    limit: Decimal | None = Field(default=None, ge=0)
    closing_day: int | None = Field(default=None, ge=1, le=31)
    due_day: int | None = Field(default=None, ge=1, le=31)
    color: str = Field(default=DEFAULT_CARD_COLOR)
    icon: str = Field(default=DEFAULT_CARD_ICON, max_length=50)

    @field_validator("color")
    @classmethod
    def validate_color(cls, value: str) -> str:
        if not HEX_COLOR_PATTERN.match(value):
            raise ValueError("invalid_card_color")
        return _validate_color(value)

    @field_validator("icon")
    @classmethod
    def validate_icon(cls, value: str) -> str:
        return _validate_icon(value)


class CardUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    institution: str | None = Field(default=None, min_length=1, max_length=120)
    limit: Decimal | None = Field(default=None, ge=0)
    closing_day: int | None = Field(default=None, ge=1, le=31)
    due_day: int | None = Field(default=None, ge=1, le=31)
    color: str | None = None
    icon: str | None = Field(default=None, max_length=50)

    @field_validator("color")
    @classmethod
    def validate_color(cls, value: str | None) -> str | None:
        if value is None:
            return value
        if not HEX_COLOR_PATTERN.match(value):
            raise ValueError("invalid_card_color")
        return _validate_color(value)

    @field_validator("icon")
    @classmethod
    def validate_icon(cls, value: str | None) -> str | None:
        if value is None:
            return value
        return _validate_icon(value)


class CardResponse(BaseModel):
    id: int
    user_id: int
    name: str
    institution: str
    limit: Decimal | None
    closing_day: int | None
    due_day: int | None
    color: str
    icon: str
    created_at: datetime

    model_config = {"from_attributes": True}
