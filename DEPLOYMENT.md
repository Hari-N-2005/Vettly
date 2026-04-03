# Vettly Deployment Guide

This project is easiest to deploy as 3 containers:
- frontend (nginx + React build)
- backend (Node.js + Express + Prisma)
- postgres

## 1. Prerequisites

- Docker Engine 24+
- Docker Compose v2+
- Anthropic API key
- (Optional) AWS S3 credentials for remote file storage

## 2. One-Time Setup

From repository root:

Linux/macOS:

```bash
cp backend/.env.docker.example backend/.env.docker
```

Windows PowerShell:

```powershell
Copy-Item backend/.env.docker.example backend/.env.docker
```

Set real values in `backend/.env.docker`:
- `JWT_SECRET`
- `GEMINI_API_KEY`
- optional AWS settings

Frontend env file is already prepared in `frontend/.env.docker` for Docker builds.

Important:
- Never commit `backend/.env.docker`.
- Use a strong random `JWT_SECRET` in production.
- Rotate any API keys that were previously committed or shared.

## 3. Start Locally With Docker

From repository root:

```bash
docker compose up --build -d
```

Check status:

```bash
docker compose ps
```

Open app:
- Frontend: http://localhost
- Backend API: http://localhost/api

View logs:

```bash
docker compose logs -f frontend backend
```

Stop stack:

```bash
docker compose down
```

Stop and remove volumes (danger: deletes database data):

```bash
docker compose down -v
```

## 4. Production Deployment (Single VPS)

### Recommended server shape
- Ubuntu 22.04+
- 2 vCPU / 4 GB RAM minimum
- 40+ GB disk

### Steps

1. Install Docker + Compose on the server.
2. Clone repository to server.
3. Create `backend/.env.docker` with production values.
4. Set domain DNS A record to your server IP.
5. Run:

```bash
docker compose up --build -d
```

### Add TLS/HTTPS
Use one of these:
- Put Caddy or Nginx Proxy Manager in front and terminate TLS.
- Or put this stack behind Cloudflare Tunnel.

For strict production, do not serve plain HTTP directly on the public internet.

## 5. Production Hardening Checklist

- Rotate `JWT_SECRET` and API keys.
- Restrict Postgres to internal network only (already internal in compose).
- Add backups for Postgres volume.
- Configure log shipping/retention.
- Set `CORS_ORIGIN` to your real frontend domain.
- Pin infrastructure secrets in a secret manager (not files) for long-term operations.

## 6. Zero-Downtime-ish Update Flow

When updating code:

```bash
git pull
docker compose build backend frontend
docker compose up -d
```

After deploy:

```bash
docker compose logs -f backend
```

Prisma migrations run automatically in backend startup (`npx prisma migrate deploy`).

## 7. Optional Cloud Paths

If you want managed services instead of all-in-one VPS:
- Frontend: Azure Static Web Apps / Vercel / Netlify
- Backend container: Azure Container Apps / AWS ECS / Render
- Database: Azure Database for PostgreSQL / AWS RDS

Redis can be added later if you implement queueing or distributed cache logic.

In that model, keep `VITE_API_URL` set to your backend public API domain.
