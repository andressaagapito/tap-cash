from app.i18n.keys import (
    CARD_NOT_FOUND,
    EMAIL_ALREADY_REGISTERED,
    EXPENSE_NOT_FOUND,
    INSTALLMENT_ALREADY_PAID,
    INSTALLMENT_NOT_FOUND,
    INSTALLMENT_NOT_PAID,
    INTERNAL_SERVER_ERROR,
    INVALID_CARD,
    INVALID_CREDENTIALS,
    INVALID_TOKEN,
    TOKEN_EXPIRED,
    USER_NOT_FOUND,
    VALIDATION_ERROR,
)

TRANSLATIONS: dict[str, dict[str, str]] = {
    EMAIL_ALREADY_REGISTERED: {
        "pt-BR": "E-mail já cadastrado",
        "en": "Email already registered",
        "es": "Correo electrónico ya registrado",
    },
    INVALID_CREDENTIALS: {
        "pt-BR": "E-mail ou senha inválidos",
        "en": "Invalid email or password",
        "es": "Correo o contraseña inválidos",
    },
    INVALID_TOKEN: {
        "pt-BR": "Token inválido",
        "en": "Invalid token",
        "es": "Token inválido",
    },
    TOKEN_EXPIRED: {
        "pt-BR": "Token inválido ou expirado",
        "en": "Invalid or expired token",
        "es": "Token inválido o expirado",
    },
    USER_NOT_FOUND: {
        "pt-BR": "Usuário não encontrado",
        "en": "User not found",
        "es": "Usuario no encontrado",
    },
    CARD_NOT_FOUND: {
        "pt-BR": "Cartão não encontrado",
        "en": "Card not found",
        "es": "Tarjeta no encontrada",
    },
    INVALID_CARD: {
        "pt-BR": "Cartão inválido",
        "en": "Invalid card",
        "es": "Tarjeta inválida",
    },
    EXPENSE_NOT_FOUND: {
        "pt-BR": "Despesa não encontrada",
        "en": "Expense not found",
        "es": "Gasto no encontrado",
    },
    INSTALLMENT_NOT_FOUND: {
        "pt-BR": "Parcela não encontrada",
        "en": "Installment not found",
        "es": "Cuota no encontrada",
    },
    INSTALLMENT_ALREADY_PAID: {
        "pt-BR": "Parcela já está paga",
        "en": "Installment is already paid",
        "es": "La cuota ya está pagada",
    },
    INSTALLMENT_NOT_PAID: {
        "pt-BR": "Parcela não foi marcada manualmente como paga",
        "en": "Installment was not manually marked as paid",
        "es": "La cuota no fue marcada manualmente como pagada",
    },
    INTERNAL_SERVER_ERROR: {
        "pt-BR": "Erro interno do servidor",
        "en": "Internal server error",
        "es": "Error interno del servidor",
    },
    VALIDATION_ERROR: {
        "pt-BR": "Erro de validação",
        "en": "Validation error",
        "es": "Error de validación",
    },
}

DEFAULT_LOCALE = "pt-BR"
SUPPORTED_LOCALES = ("pt-BR", "en", "es")
