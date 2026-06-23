from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import settings
from app.middleware.error_handlers import (
    global_exception_handler,
    http_exception_handler,
    validation_exception_handler,
)
from app.middleware.sql_injection_guard import SQLInjectionGuardMiddleware
from app.routers import auth, cards, categories, expenses, financial_profile, goals, projection
from app.utils.logger import setup_error_logger

setup_error_logger()

app = FastAPI(
    title="TapCash API",
    description="API de controle financeiro pessoal",
    version="1.0.0",
)

app.add_middleware(SQLInjectionGuardMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(cards.router)
app.include_router(categories.router)
app.include_router(goals.router)
app.include_router(expenses.router)
app.include_router(financial_profile.router)
app.include_router(projection.projection_router)
app.include_router(projection.suggestions_router)
