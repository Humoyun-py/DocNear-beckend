from .base import *  # noqa: F403

DEBUG = os.getenv("DEBUG", "true").lower() == "true"  # noqa: F405
TELEGRAM_DELETE_WEBHOOK_ON_START = os.getenv("TELEGRAM_DELETE_WEBHOOK_ON_START", "true").lower() == "true"  # noqa: F405
CORS_ALLOWED_ORIGINS = list(dict.fromkeys([
	*globals()["CORS_ALLOWED_ORIGINS"],
	"http://localhost:3001", "http://127.0.0.1:3001",
	"http://localhost:3002", "http://127.0.0.1:3002",
	"http://localhost:3003", "http://127.0.0.1:3003",
	"http://localhost:3004", "http://127.0.0.1:3004",
]))
