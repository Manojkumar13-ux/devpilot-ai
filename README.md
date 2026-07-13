# DevPilot AI — AI-Powered Coding Interview Platform

Practice coding problems, get AI-powered code reviews, and participate in
realistic follow-up interviews — all running locally via Docker.

## Problem Statement

Coding interview prep platforms (LeetCode, HackerRank) tell you if your
solution passes tests, but they don't explain **why** a solution is good
or bad, and they never ask you to reason about your code the way a real
interviewer would. DevPilot fills that gap with:

1. **AI code reviews** — structured analysis of time/space complexity,
   readability, edge cases, naming, and specific improvement suggestions
2. **AI follow-up interviews** — a question grounded in a real decision
   you made in your code, with scored evaluation of your answer
3. **Real execution** — your code runs in an isolated Docker sandbox with
   actual test cases, real timing, and memory measurement

## Architecture

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  React   │───▶│ Express  │───▶│PostgreSQL│    │  Redis   │
│  (Vite)  │    │  API     │    │          │    │ (BullMQ) │
└──────────┘    └────┬─────┘    └──────────┘    └──────────┘
                     │
               ┌─────▼─────┐
               │   Docker   │
               │  Sandbox   │
                │ (4 langs)  │
               └───────────┘
```

See [docs/Architecture.md](./docs/Architecture.md) for the full diagram and
design decisions.

## Quick Start

```bash
# Prerequisites: Node 20+, pnpm 9+, Docker

# 1. Install dependencies
pnpm install

# 2. Start infrastructure (PostgreSQL + Redis)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 3. Set up the database
pnpm --filter @devpilot/backend exec prisma db push
pnpm tsx infrastructure/scripts/seed.ts

# 4. Configure AI (required for reviews)
cp apps/backend/.env.example apps/backend/.env
# Edit .env with your OPENAI_API_KEY

# 5. Start dev servers
pnpm dev
# Backend: http://localhost:4000
# Frontend: http://localhost:5173
```

## Features

| Feature | Status | Details |
|---|---|---|
| 30 coding problems | ✅ | Arrays, Strings, Trees, DP, Graphs |
| 4 languages | ✅ | Python, Java, C++, C |
| Monaco Editor | ✅ | Syntax highlighting, auto-complete |
| Docker sandbox | ✅ | Isolated execution, 4 runtimes |
| AI code review | ✅ | Big O, readability, edge cases, naming |
| AI follow-up interview | ✅ | Code-grounded question + scored answer |
| Dashboard + analytics | ✅ | Recharts, topic breakdown, streaks |
| Submission history | ✅ | Paginated, filterable, detail view |
| Leaderboard | ✅ | Real rankings from DB |
| Admin panel | ✅ | User management |
| Security | ✅ | Helmet, CORS, rate limiting, JWT |

## AI Review Reliability

The structured rubric prompt achieves **100% valid JSON** across 25 real
submissions, vs **4%** for a naive unstructured prompt.

| Metric | Structured (rubric) | Unstructured (naive) |
|---|---|---|
| Valid JSON rate | 100.0% | 4.0% |
| Avg latency | ~4,200 ms | ~3,100 ms |
| Cost / 1,000 reviews | ~$15.00 | ~$17.00 |

See [docs/EVALUATION.md](./docs/EVALUATION.md) for the full evaluation
methodology, 5 documented failure cases, and cost projections.

## Known Limitations

1. **No multi-tenant sandbox isolation** — All user code runs in Docker
   containers on the same host. For production with untrusted users, use
   Firecracker micro-VMs or a serverless sandbox (e.g., Pulumi).

2. **No `role` column on users** — The admin panel shows all users to any
   authenticated user. Add a `role` field to the Prisma schema and migrate
   before deploying to production with untrusted users.

3. **AI review is best-effort** — The AI sometimes misidentifies Big O
   complexity or hallucinates APIs. Review scores are a guide, not a
   definitive quality metric.

4. **Redis required for submission execution** — Without Redis, the queue
   falls back to marking submissions as errors immediately. This is
   documented in the error message shown to users.

5. **No built-in rate limit on AI endpoints** — The POST /interview and
   /interview-answer endpoints call the AI API and could be abused.
   Add per-user rate limiting in production.

6. **Frontend test coverage is low** — The backend code is structurally
   typed and typechecked, but frontend components lack unit tests.

<img width="1920" height="1080" alt="Screenshot (313)" src="https://github.com/user-attachments/assets/62570267-a388-4793-8253-fd6cbb08a80f" />

<img width="1920" height="1080" alt="Screenshot (314)" src="https://github.com/user-attachments/assets/d3e2a0c2-52e6-471f-99f7-32fabb8bcbb4" />
<img width="1920" height="1080" alt="Screenshot (311)" src="https://github.com/user-attachments/assets/1b20843c-6752-415c-a990-37aa58f01457" />
<img width="1920" height="1080" alt="Screenshot (312)" src="https://github.com/user-attachments/assets/22b07cd1-a5e8-476c-aa37-c1650fc73037" />
<img width="1920" height="1080" alt="Screenshot (315)" src="https://github.com/user-attachments/assets/bbb1bb44-a6f8-42a2-87b6-7af96a4fe352" />
<img width="1920" height="1080" alt="Screenshot (316)" src="https://github.com/user-attachments/assets/f261d593-870f-4f2a-a985-60a9c70071e9" />


## Future Improvements

- [ ] Add a `role` column to users (admin/regular) with middleware guard
- [ ] Switch to `gpt-4o-mini` for AI review to reduce cost by ~10×
- [ ] Add WebSocket-based real-time submission progress
- [ ] Build a "mock interview" mode with timed problem sets
- [ ] Add C# / Kotlin / Swift runner support (requires writing generators)
- [ ] Persist AI call logs to a DB table for historical cost analysis
- [ ] Replace the naive Docker sandbox with gVisor or Firecracker
- [ ] Add Prometheus metrics endpoint + Grafana dashboard

## Project Structure

```
apps/
  backend/      Express API, Prisma, BullMQ, Docker sandbox
  frontend/     React + Vite SPA, Monaco Editor
packages/
  shared/       Shared TypeScript types
  config/       Shared ESLint/TS config
infrastructure/
  docker/       Dockerfiles, Nginx config
  scripts/      seed.ts, eval-ai-review.ts, create-admin.ts
  monitoring/   Prometheus config
docs/           Architecture, API, Database, Deployment, Evaluation
.github/
  workflows/    CI/CD pipeline
```

## License

MIT
