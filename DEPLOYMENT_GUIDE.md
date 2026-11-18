# ExecFlow — Production Deployment Guide

This guide covers deploying **ExecFlow — Management Execution System** in a production cloud environment (AWS, GCP, DigitalOcean, or on-premise Linux server) using PostgreSQL, Docker, and Nginx.

---

## 1. Production Architecture Overview

```
[ Client Browsers / Mobile ]
            │ (HTTPS :443)
            ▼
     [ Nginx Reverse Proxy / SSL Termination ]
      ┌─────┴─────────────────────────┐
      │                               │
      ▼                               ▼
[ Static Assets / CDN ]      [ FastAPI Application ]
  (React Vite Build)          (Gunicorn + Uvicorn Workers)
                                      │
                                      ▼
                             [ PostgreSQL Database ]
                                      │
                             [ Persistent Storage ]
                               (Document Uploads)
```

---

## 2. Docker & Docker Compose Deployment

### `Dockerfile.backend`
```dockerfile
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### `Dockerfile.frontend`
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### `docker-compose.yml`
```yaml
version: '3.8'

services:
  db:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_DB: execflow_prod
      POSTGRES_USER: execflow_admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U execflow_admin -d execflow_prod"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    restart: always
    environment:
      DATABASE_URL: postgresql+asyncpg://execflow_admin:${DB_PASSWORD}@db:5432/execflow_prod
      SECRET_KEY: ${SECRET_KEY}
      UPLOAD_DIR: /app/uploads
      CORS_ORIGINS: '["https://execflow.yourcompany.com"]'
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      GOOGLE_CLIENT_SECRET: ${GOOGLE_CLIENT_SECRET}
      GOOGLE_REDIRECT_URI: https://execflow.yourcompany.com/api/v1/calendar/oauth/callback
    volumes:
      - uploads_data:/app/uploads
    depends_on:
      db:
        condition: service_healthy

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    restart: always
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend

volumes:
  postgres_data:
  uploads_data:
```

---

## 3. PostgreSQL Database Migration

For PostgreSQL in production, apply Alembic migrations:

```bash
# Set your production database connection
export DATABASE_URL="postgresql+asyncpg://execflow_admin:password@localhost:5432/execflow_prod"

# Run migrations
alembic upgrade head
```

---

## 4. Nginx Production Configuration

```nginx
server {
    listen 80;
    server_name execflow.yourcompany.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name execflow.yourcompany.com;

    ssl_certificate /etc/letsencrypt/live/execflow.yourcompany.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/execflow.yourcompany.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Frontend Single Page Application
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API Endpoints
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Document & CV Uploads
    location /uploads/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
    }

    # OpenAPI Documentation
    location /docs {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
    }
}
```

---

## 5. Automated Review Cadence & Alert Cron

To ensure the Saturday review reminders and Tuesday fallback alerts execute automatically without manual triggers, configure a Linux cron job on the host server:

```bash
# Open crontab
crontab -e

# Every Saturday at 08:00 AM: Schedule weekly review reminder
0 8 * * 6 curl -X POST https://execflow.yourcompany.com/api/v1/notifications/trigger-rules -H "Authorization: Bearer <SYSTEM_SERVICE_TOKEN>"

# Every Tuesday at 09:00 AM: Evaluate fallback and trigger red alert if Saturday was missed
0 9 * * 2 curl -X POST https://execflow.yourcompany.com/api/v1/notifications/trigger-rules -H "Authorization: Bearer <SYSTEM_SERVICE_TOKEN>"
```

---

## 6. Backup Strategy

### Daily PostgreSQL Dump
```bash
pg_dump -U execflow_admin -h localhost execflow_prod | gzip > /backups/db_backup_$(date +\%F).sql.gz
```

### Uploads Directory Backup
Sync the `uploads/` directory to an AWS S3 bucket or Google Cloud Storage bucket daily:
```bash
aws s3 sync /app/uploads s3://company-execflow-backups/uploads/
```
