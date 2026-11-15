# Docker Container Deployment Guide

This repository provides containerized workflows for local development and production deployments of **Box Office Inc - Movie Studio Simulator**.

---

## Architecture & Node.js Version

The container setup is aligned with **Node.js 22 LTS (Alpine)**, matching the continuous integration environment defined in `.github/workflows/ci.yml`.

### Multi-Stage Build
The root `Dockerfile` implements a two-stage build:
1. **Frontend Builder (`frontend-builder`)**: Installs client dependencies and generates optimized production bundles via Vite (`npm run build`).
2. **Backend Runtime (`backend-runtime`)**: Installs production-only dependencies (`npm ci --omit=dev`), integrates the frontend static bundle, drops root privileges (`USER node`), and exposes the HTTP API on port `5000`.

---

## Quickstart with Docker Compose

To start the full stack (MongoDB 7.0 database + Backend API server):

```bash
docker compose up -d --build
```

### Checking Service Status
```bash
docker compose ps
```

### Viewing Logs
```bash
docker compose logs -f backend
docker compose logs -f mongodb
```

### Stopping Services
```bash
docker compose down
```

To stop services and remove persistent database volumes:
```bash
docker compose down -v
```

---

## Environment Variables

When running in production, configure the following variables in your environment or orchestrator (Kubernetes, Docker Swarm, AWS ECS, Railway):

| Variable | Description | Example / Default |
|---|---|---|
| `NODE_ENV` | Application environment | `production` |
| `PORT` | HTTP server port | `5000` |
| `MONGO_URI` | Persistent MongoDB connection string | `mongodb://mongodb:27017/boxoffice-sim` |
| `JWT_ACCESS_SECRET` | 32+ char secret for signing access tokens | Must be unique & strong |
| `JWT_REFRESH_SECRET` | 32+ char secret for signing refresh tokens | Must differ from access secret |
| `CLIENT_URL` | Allowed CORS origin for client web app | `https://your-domain.com` |
| `RATE_LIMIT_STORE` | Shared rate limit storage engine | `mongodb` |

---

## Container Security & Healthchecks

1. **Non-Root Execution**: The production image switches to the unprivileged `node` user before launching the application process.
2. **Built-In Healthcheck**: The container monitors `http://localhost:5000/api/health` every 20 seconds. Unhealthy containers are automatically flagged by container orchestrators.
3. **Persistent Volume**: Database records are persisted across container restarts using the `mongo-data` named Docker volume.
