from .base import *
import os
import stripe
from django.core.exceptions import ImproperlyConfigured

DEBUG = False

# Required production secrets
# base.py falls back to placeholder/dev/test values (e.g. "dev-insecure-key",
# "test_secret_key") so local/dev/test can boot without real credentials. In
# production those fallbacks are unacceptable, so fail fast if a required secret
# is missing, empty, or still set to a known placeholder/dev/test value.
_PLACEHOLDER_SECRETS = {
    "dev-insecure-key",
    "portfolio-local-secret-key-change-before-public-deployment",
    "test_secret_key",
    "test_publishable_key",
    "test_webhook_secret",
}
_PLACEHOLDER_MARKERS = ("changeme", "change-before", "placeholder", "insecure", "example")


def _require_prod_secret(name, value):
    normalized = (value or "").strip()
    lowered = normalized.lower()
    if (
        not normalized
        or normalized in _PLACEHOLDER_SECRETS
        or lowered.startswith(("dev-", "test_", "test-"))
        or any(marker in lowered for marker in _PLACEHOLDER_MARKERS)
    ):
        raise ImproperlyConfigured(
            f"{name} must be set to a real production value "
            "(missing, empty, or placeholder/dev/test value detected)."
        )
    return normalized


SECRET_KEY = _require_prod_secret("DJANGO_SECRET_KEY", SECRET_KEY)
STRIPE_SECRET_KEY = _require_prod_secret("STRIPE_SECRET_KEY", STRIPE_SECRET_KEY)
STRIPE_PUBLISHABLE_KEY = _require_prod_secret("STRIPE_PUBLISHABLE_KEY", STRIPE_PUBLISHABLE_KEY)
STRIPE_WEBHOOK_SECRET = _require_prod_secret("STRIPE_WEBHOOK_SECRET", STRIPE_WEBHOOK_SECRET)
stripe.api_key = STRIPE_SECRET_KEY

# Security
SECURE_SSL_REDIRECT = os.getenv("DJANGO_SECURE_SSL_REDIRECT", "False").lower() == "true"
SECURE_HSTS_SECONDS = int(os.getenv("DJANGO_HSTS_SECONDS", "0"))
SECURE_HSTS_INCLUDE_SUBDOMAINS = SECURE_HSTS_SECONDS > 0
SECURE_HSTS_PRELOAD = SECURE_HSTS_SECONDS > 0
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SESSION_COOKIE_SECURE = os.getenv("DJANGO_SECURE_COOKIES", "False").lower() == "true"
CSRF_COOKIE_SECURE = SESSION_COOKIE_SECURE
CSRF_TRUSTED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CSRF_TRUSTED_ORIGINS", "").split(",")
    if origin.strip()
]
CORS_ALLOW_ALL_ORIGINS = os.getenv("CORS_ALLOW_ALL_ORIGINS", "False").lower() == "true"
CORS_ALLOWED_ORIGINS = [
    origin.strip() for origin in os.getenv("CORS_ALLOWED_ORIGINS", "").split(",") if origin.strip()
]

# Database
"""
SSL is disabled — because traffic in the container network is secure.
If you connect from another server, you need to configure SSL in Postgres and change sslmode in Django
"""
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('POSTGRES_DB'),
        'USER': os.getenv('POSTGRES_USER'),
        'PASSWORD': os.getenv('POSTGRES_PASSWORD'),
        'HOST': os.getenv('POSTGRES_HOST'),
        'PORT': os.getenv('POSTGRES_PORT'),
        'CONN_MAX_AGE': 300,
        'OPTIONS': {
            'sslmode': 'disable',
            'connect_timeout': 5,
        },
    }
}

# Redis / Celery
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://redis:6379/0")
CELERY_RESULT_BACKEND = CELERY_BROKER_URL
CELERY_WORKER_MAX_TASKS_PER_CHILD = 100
CELERY_TASK_ACKS_LATE = True
CELERY_TASK_TIME_LIMIT = 300

# S3 Storage
USE_S3_STORAGE_VALUE = os.getenv("USE_S3_STORAGE")

if USE_S3_STORAGE_VALUE is None or USE_S3_STORAGE_VALUE.lower() not in ("true", "false"):
    raise ImproperlyConfigured("USE_S3_STORAGE must be explicitly set to True or False.")

USE_S3_STORAGE = USE_S3_STORAGE_VALUE.lower() == "true"

if USE_S3_STORAGE:
    AWS_STORAGE_BUCKET_NAME = os.getenv("AWS_STORAGE_BUCKET_NAME")
    AWS_S3_REGION_NAME = os.getenv("AWS_S3_REGION_NAME", "ca-central-1")
    AWS_S3_CUSTOM_DOMAIN = os.getenv("AWS_S3_CUSTOM_DOMAIN")

    STORAGES = {
        'default': {
            'BACKEND': 'storages.backends.s3.S3Storage',
            'OPTIONS': {
                'bucket_name': AWS_STORAGE_BUCKET_NAME,
                'region_name': AWS_S3_REGION_NAME,
                'custom_domain': AWS_S3_CUSTOM_DOMAIN,
                'file_overwrite': False,
                'default_acl': None,
                'querystring_auth': False,
                'max_memory_size': 100_000_000,
                'signature_version': 's3v4',
            },
        },
        'staticfiles': {
            'BACKEND': 'django.contrib.staticfiles.storage.StaticFilesStorage',
        },
    }

    if AWS_S3_CUSTOM_DOMAIN:
        MEDIA_URL = f'https://{AWS_S3_CUSTOM_DOMAIN}/'

# Logging
# Console logging is the default: Docker captures stdout/stderr, and it keeps the
# deploy check (`manage.py check --deploy`) working anywhere without depending on a
# pre-created log directory. File logging is opt-in via DJANGO_LOG_DIR (set to
# /var/log/django in docker-compose.prod.yml); the directory is created safely so
# logging config never fails on a missing path.
LOGGING.setdefault('handlers', {})
LOGGING.setdefault('loggers', {})

LOGGING['loggers']['django'] = {
    'handlers': ['console'],
    'level': 'INFO',
    'propagate': True,
}

DJANGO_LOG_DIR = os.getenv("DJANGO_LOG_DIR", "").strip()
if DJANGO_LOG_DIR:
    os.makedirs(DJANGO_LOG_DIR, exist_ok=True)
    LOGGING['handlers']['file'] = {
        'level': 'ERROR',
        'class': 'logging.handlers.RotatingFileHandler',
        'filename': os.path.join(DJANGO_LOG_DIR, 'error.log'),
        'maxBytes': 10 * 1024 * 1024,
        'backupCount': 5,
        'formatter': 'verbose',
    }
    LOGGING['loggers']['django']['handlers'].append('file')
