# Deployment

## Prerequisites

- Docker & Docker Compose v2
- PostgreSQL 16 (or use the Docker image)
- Redis 7 (or use the Docker image)
- Node.js 20+ and pnpm 9+ (for local dev)
- Domain name with DNS pointing to your server
- SSL certificates (Let's Encrypt via certbot)

## Production Topology

```
                  Internet
                     │
                  DNS A record
                     │
               ┌─────┴─────┐
               │   Nginx    │  :80 → 301 → :443
               │  :443      │  reverse proxy
               └─────┬─────┘
                     │
          ┌──────────┼──────────┐
          │          │          │
     ┌────┴───┐ ┌───┴────┐ ┌───┴────┐
     │ Backend│ │Frontend│ │ Redis  │
     │ :4000  │ │ :80    │ │ :6379  │
     └────┬───┘ └────────┘ └────────┘
          │
     ┌────┴───┐
     │Postgres│
     │ :5432  │
     └────────┘
```

## Quick Start (Production)

```bash
# 1. Clone on your server
git clone https://github.com/your-org/devpilot-ai.git /opt/devpilot
cd /opt/devpilot

# 2. Configure environment
cp apps/backend/.env.example apps/backend/.env
# Edit JWT_SECRET, OPENAI_API_KEY, etc.

# 3. Start all services
docker compose up -d

# 4. Run database migrations
docker compose exec backend npx prisma db push

# 5. Seed problems
docker compose exec backend pnpm tsx infrastructure/scripts/seed.ts

# 6. Verify
curl https://yourdomain.com/health
# → {"status":"ok","db":"connected"}
```

## Docker Compose Configuration

The production stack is defined in `docker-compose.yml`:

| Service | Image | Port | Notes |
|---|---|---|---|
| `postgres` | postgres:16-alpine | 5432 | Persistent volume |
| `redis` | redis:7-alpine | 6379 | Queue backend |
| `backend` | custom | 4000 | Express API |
| `frontend` | custom | 80 | Vite SPA (Nginx) |
| `nginx` | nginx:alpine | 80/443 | Reverse proxy |

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/deploy.yml`) runs on every
push to `main`:

1. **Test** — Spin up Postgres + Redis, install deps, run typecheck
2. **Build** — Build Docker images, push to GHCR
3. **Deploy** — SSH into server, pull images, restart containers

Secrets required in GitHub:
- `DEPLOY_SSH_KEY` — private SSH key
- `DEPLOY_KNOWN_HOSTS` — server's host key fingerprint
- `DEPLOY_USER` — SSH username
- `DEPLOY_HOST` — server hostname or IP

## Environment Variables (Backend)

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `JWT_SECRET` | Yes | — | Secret for signing JWTs |
| `OPENAI_API_KEY` | No* | — | OpenAI key for AI review |
| `ANTHROPIC_API_KEY` | No* | — | Anthropic key (alternative) |
| `AI_PROVIDER` | No | `claude` | `claude` or `openai` |
| `BACKEND_PORT` | No | `4000` | Express listen port |
| `REDIS_URL` | No | — | Redis for BullMQ queue |
| `LOG_LEVEL` | No | `info` | `debug`, `info`, `warn`, `error` |

\* At least one AI provider key must be set for AI review features.

## Environment Variables (Frontend)

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_BACKEND_URL` | No | `http://localhost:4000` | API base URL |

## Scaling Considerations

- **Stateless backend**: Horizontally scale the `backend` service behind
  the Nginx upstream. Sessions use JWT (no server-side state).
- **Queue**: Redis is single-threaded. For high throughput, use Redis
  Cluster or externalize to Upstash.
- **Sandbox execution**: The Docker sandbox runs on the same host. For
  multi-tenant isolation, migrate to Firecracker micro-VMs.
- **Database**: Start with a managed PostgreSQL (RDS, Cloud SQL). Add
  PgBouncer for connection pooling at >100 concurrent connections.

## Monitoring

- **Health checks**: `GET /health` (DB), `GET /ready`, `GET /live`
- **AI call logging**: In-memory `getAiCallLog()` — integrates with eval
  script for cost analysis
- **Prometheus**: `infrastructure/monitoring/prometheus.yml` for metrics
  scraping (requires a `/metrics` endpoint on the backend)
