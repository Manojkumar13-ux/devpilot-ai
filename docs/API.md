# API Reference

Base URL: `http://localhost:4000` (development) or `https://api.devpilot.example.com` (production)

All endpoints except `POST /auth/register` and `POST /auth/login` require a
Bearer JWT token in the `Authorization` header.

```
Authorization: Bearer <accessToken>
```

---

## Auth

### `POST /auth/register`

Create a new account.

**Request body:**
```json
{ "email": "user@example.com", "password": "secret123", "username": "user1" }
```

**Response `201`:**
```json
{
  "user": { "id": "uuid", "email": "...", "username": "...", "createdAt": "..." },
  "tokens": { "accessToken": "jwt...", "refreshToken": "jwt..." }
}
```

### `POST /auth/login`

**Request body:**
```json
{ "email": "user@example.com", "password": "secret123" }
```

**Response `200`:**
```json
{ "user": { ... }, "tokens": { "accessToken": "...", "refreshToken": "..." } }
```

### `GET /auth/me`

Returns the current user from the JWT token.

**Response `200`:**
```json
{ "id": "uuid", "email": "...", "username": "...", "createdAt": "..." }
```

### `POST /auth/logout`

No-op (client-side token removal). Returns `204`.

---

## Problems

### `GET /problems`

List all problems. Supports query parameters for filtering.

**Query params:** `search`, `difficulty` (Easy/Medium/Hard), `category`

**Response `200`:**
```json
[
  {
    "id": "uuid",
    "slug": "two-sum",
    "title": "Two Sum",
    "difficulty": "Easy",
    "category": "Arrays",
    "testCaseCount": 4
  }
]
```

### `GET /problems/:slug`

Get a single problem with test cases.

**Response `200`:**
```json
{
  "id": "uuid",
  "slug": "...",
  "title": "...",
  "difficulty": "...",
  "category": "...",
  "description": "...",
  "starterCode": { "javascript": "...", "python": "...", ... },
  "testCases": [ { "id": "uuid", "input": "...", "expectedOutput": "...", "isHidden": false } ]
}
```

---

## Submissions

### `POST /submissions/run`

Run code against visible test cases only. Queues execution.

**Request body:**
```json
{ "problemId": "uuid", "code": "...", "language": "python" }
```

**Response `201`:**
```json
{ "id": "uuid", "status": "pending" }
```

### `POST /submissions/submit`

Submit code against all test cases. May trigger AI review.

Same request/response as `/run`.

### `GET /submissions`

List user's submissions with pagination.

**Query params:** `page` (default 1), `limit` (default 20, max 100), `status`, `language`

**Response `200`:**
```json
{
  "submissions": [
    {
      "id": "uuid",
      "problemId": "uuid",
      "code": "...",
      "language": "python",
      "status": "completed",
      "testResults": [ ... ],
      "runtime": 12.5,
      "memory": 8192,
      "errorType": null,
      "errorMessage": null,
      "createdAt": "...",
      "problem": { "title": "Two Sum" },
      "aiReview": { "readabilityScore": 8, "edgeCaseScore": 7, "namingScore": 9 }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 45, "totalPages": 3 }
}
```

### `GET /submissions/:id`

Get full submission detail including AI review and interview.

**Response `200`:**
```json
{
  "id": "uuid",
  "code": "...",
  "language": "python",
  "status": "completed",
  "testResults": [ { "pass": true, "runtime": 1.2, "memory": 4096, "expected": "3", "actual": "3" } ],
  "problem": { "title": "Two Sum", "difficulty": "Easy", "category": "Arrays" },
  "aiReview": { "timeComplexity": "O(n)", "spaceComplexity": "O(1)", "readabilityScore": 8, ... },
  "interview": { "question": "...", "userAnswer": "...", "verdict": "clear_tradeoff_reasoning", "score": 8 }
}
```

### `GET /submissions/:id/review`

Poll for AI review status.

**Response `200` (pending):** `{ "status": "pending" }`
**Response `200` (completed):** `{ "status": "completed", "review": { ... } }`
**Response `200` (error):** `{ "status": "error", "errorType": "...", "errorMessage": "..." }`

---

## AI Interview (Follow-up)

### `POST /submissions/:id/interview`

Generate or retrieve the existing interview question.

**Response `200`:**
```json
{ "question": "...", "interviewId": "uuid", "answered": false }
```

### `POST /submissions/:id/interview-answer`

Submit an answer for evaluation.

**Request body:** `{ "answer": "..." }`

**Response `200`:**
```json
{ "verdict": "clear_tradeoff_reasoning", "strengths": "...", "weaknesses": "...", "score": 8, "interviewId": "uuid" }
```

### `GET /submissions/:id/interview`

Get interview status.

---

## Analytics

### `GET /analytics`

User dashboard data — problems solved, streaks, topic breakdown, AI score
trend, interview trend, recent activity.

### `GET /leaderboard`

Global leaderboard — all users ranked by problems solved.

---

## Profile

### `GET /profile`

Current user's profile.

### `PATCH /profile`

Update username or email.

**Request body:** `{ "username": "newName" }` or `{ "email": "new@email.com" }`

---

## Admin

### `GET /admin/users`

List all users with submission counts.

### `GET /admin/problems`

List all problems with test case and submission counts.

### `GET /admin/stats`

System stats: user count, problem count, submission count.

---

## Health

### `GET /health`

DB connectivity check. Returns `200` with `{ "status": "ok", "db": "connected" }`
or `503` if PostgreSQL is unreachable.

### `GET /ready`

Readiness probe — returns `200` when DB is connected, `503` otherwise.

### `GET /live`

Liveness probe — always returns `200`.
