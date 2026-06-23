from fastapi import Request

from app.i18n.translations import DEFAULT_LOCALE, SUPPORTED_LOCALES, TRANSLATIONS


def resolve_locale(request: Request | None) -> str:
    if not request:
        return DEFAULT_LOCALE

    accept_language = request.headers.get("accept-language", DEFAULT_LOCALE)
    for part in accept_language.split(","):
        lang = part.split(";")[0].strip()
        if lang in SUPPORTED_LOCALES:
            return lang
        if lang.startswith("pt"):
            return "pt-BR"
        if lang.startswith("en"):
            return "en"
        if lang.startswith("es"):
            return "es"
    return DEFAULT_LOCALE


def translate(key: str, locale: str | None = None, fallback: str | None = None) -> str:
    loc = locale or DEFAULT_LOCALE
    entry = TRANSLATIONS.get(key, {})
    return entry.get(loc) or entry.get(DEFAULT_LOCALE) or fallback or key


def translate_detail(detail, locale: str) -> str:
    if isinstance(detail, str) and detail in TRANSLATIONS:
        return translate(detail, locale)
    if isinstance(detail, str):
        return detail
    if isinstance(detail, list):
        return "; ".join(str(item) for item in detail)
    return str(detail)
