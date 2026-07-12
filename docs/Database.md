# Database Schema

DevPilot uses PostgreSQL 16 with Prisma ORM. The schema is defined in
`apps/backend/prisma/schema.prisma`.

## Entity-Relationship Diagram

```
users
│
└─── submissions
     │
     ├─── problems
     │
     ├─── ai_reviews
     │
     └─── interview_followups
     
problems
│
└─── test_cases
```

## Tables

### `users`

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| email | VARCHAR(255) | Unique |
| password_hash | VARCHAR(255) | `salt:sha256(salt+password)` |
| username | VARCHAR(100) | Unique |
| created_at | TIMESTAMP | Default `now()` |

### `problems`

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| slug | VARCHAR(255) | Unique, URL-safe identifier |
| title | TEXT | Human-readable name |
| difficulty | VARCHAR(20) | `Easy`, `Medium`, or `Hard` |
| category | VARCHAR(100) | e.g. `Arrays`, `Strings`, `Trees` |
| description | TEXT | Markdown problem statement |
| starter_code | JSONB | `{ "javascript": "...", "python": "...", ... }` |
| created_at | TIMESTAMP | Default `now()` |

### `test_cases`

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| problem_id | UUID | FK → `problems.id`, cascade delete |
| input | TEXT | Serialized JSON input |
| expected_output | TEXT | Serialized JSON expected value |
| is_hidden | BOOLEAN | Hidden test cases not shown to users |

### `submissions`

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| user_id | UUID | FK → `users.id`, cascade delete |
| problem_id | UUID | FK → `problems.id`, cascade delete |
| code | TEXT | The submitted source code |
| language | VARCHAR(50) | e.g. `javascript`, `python`, `cpp` |
| status | VARCHAR(20) | `pending`, `running`, `completed`, `error` |
| test_results | JSONB | Array of `{ pass, runtime, memory, expected, actual }` |
| runtime | FLOAT | Average runtime in ms |
| memory | INTEGER | Peak memory in KB |
| error_type | VARCHAR(50) | `compilation_error`, `runtime_error`, etc. |
| error_message | TEXT | Error details |
| created_at | TIMESTAMP | Default `now()` |
| finished_at | TIMESTAMP | When execution completed |

### `ai_reviews`

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| submission_id | UUID | Unique FK → `submissions.id`, cascade delete |
| time_complexity | VARCHAR(50) | e.g. `O(n)`, `O(n log n)` |
| space_complexity | VARCHAR(50) | e.g. `O(1)`, `O(n)` |
| readability_score | INTEGER | 1–10 |
| edge_case_score | INTEGER | 1–10 |
| naming_score | INTEGER | 1–10 |
| suggested_improvement | TEXT | AI-generated suggestion |
| error_type | VARCHAR(50) | `not_configured`, `call_failed`, `parse_failed` |
| error_message | TEXT | |
| created_at | TIMESTAMP | Default `now()` |

### `interview_followups`

| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| submission_id | UUID | Unique FK → `submissions.id`, cascade delete |
| question | TEXT | AI-generated question |
| user_answer | TEXT | Candidate's response |
| verdict | VARCHAR(50) | `clear_tradeoff_reasoning`, `vague_missing_key_detail`, `incorrect_understanding` |
| strengths | TEXT | AI analysis |
| weaknesses | TEXT | AI analysis |
| score | INTEGER | 1–10 |
| created_at | TIMESTAMP | Default `now()` |
| answered_at | TIMESTAMP | When answer was submitted |

## Indexes

Primary indexes exist on all `id` (UUID) and `*_id` (FK) columns.
Unique indexes on `users.email`, `users.username`, `problems.slug`,
`ai_reviews.submission_id`, `interview_followups.submission_id`.

## Migrations

```bash
# Create a migration after schema changes
pnpm --filter @devpilot/backend exec prisma migrate dev --name describe_change

# Apply to production
pnpm --filter @devpilot/backend exec prisma migrate deploy

# Push schema directly (dev only)
pnpm --filter @devpilot/backend exec prisma db push
```
