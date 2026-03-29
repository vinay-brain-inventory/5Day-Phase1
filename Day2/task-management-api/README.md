# Day 2 — Task Management API (Express + PostgreSQL)

A clean REST API that focuses on structure, security fundamentals, and “show your work” raw SQL (no ORM).

## Features

- Tasks CRUD:
  - `GET /tasks` (pagination + optional `status` filter)
  - `GET /tasks/:id`
  - `POST /tasks`
  - `PUT /tasks/:id`
  - `PATCH /tasks/:id`
  - `DELETE /tasks/:id`
- Auth:
  - `POST /auth/login`
  - `POST /auth/refresh` (refresh token rotation; **hashes stored in DB**)
- Security:
  - `helmet`, `cors`, `express-rate-limit`
  - **Parameterized SQL** to prevent injection
- Observability:
  - `pino` structured logging
  - request id (`x-request-id`) attached to every log line/response
- ES Modules (`type: "module"`)
- Graceful shutdown (`SIGINT`/`SIGTERM`) closes HTTP server and PG pool

## Setup

### 1) Configure env

```bash
cp .env.example .env
```

Set `DATABASE_URL`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET`.

### 2) Create DB + run schema

```bash
createdb tasks_api
psql "$DATABASE_URL" -f sql/001_init.sql
```

This seeds a demo user:

- email: `demo@example.com`
- password: `password123`

### 3) Install + run

```bash
npm install
npm run dev
```

Health check:

- `GET /health`

## Postman

Import the collection JSON:

- `postman/TaskManagement.postman_collection.json`

It includes tests for:

- happy paths
- `401 Unauthorized` (missing/invalid token)
- `400 ValidationError` (bad request bodies)

