#!/bin/bash

echo "Waiting for PostgreSQL..."
while ! python -c "
import socket, os
sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
sock.settimeout(1)
host = os.environ['POSTGRES_HOST']
port = int(os.environ['POSTGRES_PORT'])
result = sock.connect_ex((host, port))
sock.close()
exit(result)
"; do
  sleep 2
done
echo "PostgreSQL ready"

if [ "$SERVICE_NAME" = "backend" ]; then
    echo "Applying migrations..."
    python manage.py migrate --noinput

    echo "Collecting static files..."
    python manage.py collectstatic --noinput
fi

exec "$@"
