# ===== (Builder) =====
FROM python:3.12-slim AS builder

RUN apt-get update && apt-get install -y \
    gcc \
    python3-dev \
    libpq-dev \
    libffi-dev \
    libjpeg-dev \
    zlib1g-dev \
    netcat-openbsd \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY ./backend/requirements.txt .
RUN pip install --upgrade pip && \
    pip install --user -r requirements.txt

# ===== (Development) =====
FROM python:3.12-slim AS development

COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

RUN apt-get update && apt-get install -y \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY . .

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# ===== (Production) =====
FROM python:3.12-slim AS production

COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y \
    libpq5 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY ./backend /app

RUN mkdir -p /var/log/django && \
    mkdir -p /app/staticfiles && \
    touch /var/log/django/error.log && \
    chmod -R 777 /var/log/django

ENV DJANGO_SETTINGS_MODULE=backend.settings.prod

COPY ./backend/entrypoint.sh /app/entrypoint.sh

RUN chmod +x /app/entrypoint.sh

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/health/', timeout=5)" || exit 1

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "4", "--threads", "2", \
     "--worker-class", "gthread", "--timeout", "30", "--keep-alive", "5", \
     "--access-logfile", "-", "--error-logfile", "-", "backend.wsgi:application"]
