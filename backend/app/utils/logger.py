import logging
from datetime import date
from logging import LogRecord
from pathlib import Path

LOGS_DIR = Path(__file__).resolve().parents[2] / "logs"


def get_error_log_file(for_day: date | None = None) -> Path:
    day = for_day or date.today()
    return LOGS_DIR / f"{day.isoformat()}-errors.log"


class DailyErrorFileHandler(logging.FileHandler):
    def __init__(self) -> None:
        LOGS_DIR.mkdir(parents=True, exist_ok=True)
        self._current_day = date.today()
        super().__init__(get_error_log_file(self._current_day), encoding="utf-8")

    def emit(self, record: LogRecord) -> None:
        today = date.today()
        if today != self._current_day:
            self.close()
            self._current_day = today
            self.baseFilename = str(get_error_log_file(today))
            self.stream = self._open()
        super().emit(record)


class HttpErrorFormatter(logging.Formatter):
    def format(self, record: LogRecord) -> str:
        timestamp = self.formatTime(record, self.datefmt)
        status_code = getattr(record, "status_code", 500)
        return f"{timestamp} | HTTP {status_code} | {record.getMessage()}"


def setup_error_logger() -> logging.Logger:
    logger = logging.getLogger("tapcash.errors")
    logger.setLevel(logging.ERROR)
    logger.propagate = False

    if logger.handlers:
        return logger

    handler = DailyErrorFileHandler()
    handler.setFormatter(HttpErrorFormatter(datefmt="%Y-%m-%d %H:%M:%S"))
    logger.addHandler(handler)
    return logger


error_logger = setup_error_logger()


def log_http_error(status_code: int, message: str, method: str = "", path: str = "") -> None:
    clean_message = " ".join(message.split())
    text = clean_message
    if method and path:
        text = f"{clean_message} | {method} {path}"
    error_logger.error(text, extra={"status_code": status_code})
