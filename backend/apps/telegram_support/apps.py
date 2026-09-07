from django.apps import AppConfig


class TelegramSupportConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.telegram_support"

    def ready(self):
        from . import schema  # noqa: F401
