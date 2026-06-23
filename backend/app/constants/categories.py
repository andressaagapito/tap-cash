BUILTIN_CATEGORY_KEYS = [
    "food",
    "housing",
    "transport",
    "health",
    "education",
    "leisure",
    "clothing",
    "subscriptions",
    "other",
]


def is_builtin_category(name: str) -> bool:
    return name in BUILTIN_CATEGORY_KEYS
