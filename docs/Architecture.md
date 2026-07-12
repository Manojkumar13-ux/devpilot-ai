# Architecture

DevPilot is a monorepo with two main applications (`apps/backend`, `apps/frontend`)
and supporting infrastructure.

```
┌─────────────────────────────────────────────────────────┐
│                     Nginx (reverse proxy)                │
│  rate limiting · SSL termination · SPA fallback         │
└────────┬──────────────────────────────────┬──────────────┘
         │  /api/*                    /*    │
         ▼                                   ▼
┌─────────────────┐              ┌────────────────────┐
│  Express Backend │              │  Vite SPA (React)  │
│  :4000           │              │  :80               │
├─────────────────┤              ├────────────────────┤
│  Auth (JWT)      │              │  Monaco Editor     │
│  Problem CRUD    │              │  Recharts          │
│  Submission exec │              │  Glassmorphism UI  │
│  AI Review       │              │  Router            │
│  Queue (BullMQ)  │              └────────────────────┘
│  Prisma ORM      │
└───────┬──────────┘
        │
        ├────────────────────┐
        ▼                    ▼
┌──────────────┐    ┌──────────────┐
│  PostgreSQL   │    │   Redis      │
│  :5432        │    │  :6379       │
│  (persistent) │    │  (queue)     │
└──────────────┘    └──────────────┘
```

## Key Design Decisions

### 1. Monorepo with pnpm workspaces

All packages live in one repo. `pnpm` handles linking. `Turbo` runs builds
and typechecks in parallel. The structure:

```
apps/
  backend/     Express API, Prisma, BullMQ, Docker sandbox
  frontend/    React + Vite, Monaco Editor, Recharts
packages/
  shared/      Types shared between front+back
  config/      Shared ESLint/TS config
infrastructure/
  docker/      Dockerfiles, Nginx config
  scripts/     Seed, migrate, eval, admin creation
```

### 2. Submission execution isolation

User code runs inside Docker containers via `docker run --rm`. Each
language has a compile step (for C++, Java, Go, Rust, C) and a run step.
The sandbox image includes Node, Python, Java, GCC, Go, and Rust.

### 3. AI review via structured prompts

The AI review service sends a carefully structured JSON-schema prompt
(rather than free-form text) and validates the response with strict
type checking. An in-memory call log tracks latency and token usage.

See [EVALUATION.md](./EVALUATION.md) for reliability metrics.

### 4. Queue-driven submission processing

Submissions are enqueued to BullMQ (backed by Redis). The worker picks
them up, executes in Docker, saves results, and triggers an AI review if
all tests passed. This prevents the HTTP request from blocking.

### 5. Glassmorphism UI with dark theme

The frontend uses a custom dark theme (`#0a0a0f` background) with
glassmorphism cards (`backdrop-filter: blur`), gradient accents, and
recharts for data visualization. No heavy CSS framework — utility classes
are defined in `index.css`.
