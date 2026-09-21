"""Conservative Gunicorn defaults; secrets are never logged."""
import multiprocessing
import os

bind = os.getenv("GUNICORN_BIND", f"0.0.0.0:{os.getenv('PORT', '8000')}")
workers = int(os.getenv("GUNICORN_WORKERS", str(max(2, multiprocessing.cpu_count() * 2 + 1))))
threads = int(os.getenv("GUNICORN_THREADS", "2"))
timeout = int(os.getenv("GUNICORN_TIMEOUT", "60"))
graceful_timeout = int(os.getenv("GUNICORN_GRACEFUL_TIMEOUT", "30"))
keepalive = int(os.getenv("GUNICORN_KEEPALIVE", "5"))
accesslog = "-"
errorlog = "-"
loglevel = os.getenv("GUNICORN_LOGLEVEL", "info")
capture_output = True
forwarded_allow_ips = os.getenv("GUNICORN_FORWARDED_ALLOW_IPS", "127.0.0.1")
