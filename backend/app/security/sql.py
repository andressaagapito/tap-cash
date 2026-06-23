"""Helpers to reduce SQL injection and unsafe LIKE/wildcard abuse.

All database access in this project must use SQLAlchemy ORM/Core with bound
parameters. Never interpolate user input into raw SQL strings.
"""

from __future__ import annotations

import re
from re import Pattern

LIKE_ESCAPE_CHAR = "\\"
DEFAULT_SEARCH_MAX_LENGTH = 200

# Compound attack signatures — avoids blocking single quotes in legitimate text.
_SQL_INJECTION_PATTERNS: tuple[Pattern[str], ...] = (
    re.compile(r"'\s*(or|and)\s*'?\s*\d", re.IGNORECASE),
    re.compile(r"'\s*(or|and)\s+['\"]?\w+['\"]?\s*=\s*", re.IGNORECASE),
    re.compile(r";\s*(drop|delete|truncate|alter|create|insert|update|select)\b", re.IGNORECASE),
    re.compile(
        r"\b(union|select|insert|update|delete|drop|alter|create)\b.+\b(from|into|table|database|values)\b",
        re.IGNORECASE | re.DOTALL,
    ),
    re.compile(r"/\*.*\*/", re.DOTALL),
    re.compile(r"\b(sleep|benchmark|waitfor\s+delay|pg_sleep)\s*\(", re.IGNORECASE),
    re.compile(r"\b(information_schema|pg_catalog|sqlite_master)\b", re.IGNORECASE),
    re.compile(r"(\%27)|(\%23)|(\%3B)", re.IGNORECASE),
)


def strip_null_bytes(value: str) -> str:
    return value.replace("\x00", "")


def sanitize_text_input(value: str, *, max_length: int = DEFAULT_SEARCH_MAX_LENGTH) -> str:
    cleaned = strip_null_bytes(value).strip()
    if len(cleaned) > max_length:
        return cleaned[:max_length]
    return cleaned


def escape_like_pattern(value: str, escape_char: str = LIKE_ESCAPE_CHAR) -> str:
    escaped = value.replace(escape_char, escape_char + escape_char)
    escaped = escaped.replace("%", escape_char + "%")
    return escaped.replace("_", escape_char + "_")


def prepare_ilike_contains(value: str, *, max_length: int = DEFAULT_SEARCH_MAX_LENGTH) -> str:
    """Return a LIKE pattern with wildcards; caller must pass escape=LIKE_ESCAPE_CHAR."""
    term = sanitize_text_input(value, max_length=max_length)
    return f"%{escape_like_pattern(term)}%"


def contains_sql_injection(value: str) -> bool:
    if not value:
        return False
    normalized = strip_null_bytes(value)
    return any(pattern.search(normalized) for pattern in _SQL_INJECTION_PATTERNS)
