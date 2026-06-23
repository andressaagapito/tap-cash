from fastapi import Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.i18n.keys import INTERNAL_SERVER_ERROR, VALIDATION_ERROR
from app.i18n.utils import resolve_locale, translate, translate_detail
from app.utils.logger import log_http_error


def format_validation_errors(exc: RequestValidationError, locale: str) -> str:
    messages = []
    for error in exc.errors():
        location = ".".join(str(item) for item in error.get("loc", []))
        messages.append(f"{location}: {error.get('msg', translate(VALIDATION_ERROR, locale))}")
    return "; ".join(messages) if messages else translate(VALIDATION_ERROR, locale)


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    locale = resolve_locale(request)
    message = translate_detail(exc.detail, locale)
    detail_key = exc.detail if isinstance(exc.detail, str) and exc.detail.startswith("errors.") else None
    log_http_error(exc.status_code, message, request.method, request.url.path)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": message, "detail_key": detail_key},
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    locale = resolve_locale(request)
    message = format_validation_errors(exc, locale)
    log_http_error(422, message, request.method, request.url.path)
    return JSONResponse(status_code=422, content={"detail": message, "errors": exc.errors()})


async def global_exception_handler(request: Request, exc: Exception):
    locale = resolve_locale(request)
    log_http_error(500, str(exc), request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"detail": translate(INTERNAL_SERVER_ERROR, locale)},
    )
