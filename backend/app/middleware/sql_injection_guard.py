from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.i18n.keys import VALIDATION_ERROR
from app.i18n.utils import resolve_locale, translate
from app.security.sql import contains_sql_injection


class SQLInjectionGuardMiddleware(BaseHTTPMiddleware):
    """Reject obvious SQL injection attempts in query parameters."""

    async def dispatch(self, request: Request, call_next):
        for value in request.query_params.values():
            if contains_sql_injection(value):
                locale = resolve_locale(request)
                message = translate(VALIDATION_ERROR, locale)
                return JSONResponse(
                    status_code=400,
                    content={"detail": message, "detail_key": VALIDATION_ERROR},
                )

        return await call_next(request)
