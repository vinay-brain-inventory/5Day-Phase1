# Day 4 — Microservices Split (Auth + Resource) + API Gateway

This day splits the Day2-style “auth + tasks” monolith into:

- **Auth Service**: login + token issuing, plus **audit logging**.
- **Resource Service**: CRUD-ish “resources” (kept minimal: create + list).
- **API Gateway**: single entrypoint that proxies requests and verifies access tokens centrally.

Services talk HTTP REST, and they also communicate via **Redis Pub/Sub**:

- when a resource is created in Resource Service, it publishes a `resource.created` event
- Auth Service consumes it and writes an audit log entry

## Ports (local)

- Auth Service: `http://localhost:4001`
- Resource Service: `http://localhost:4002`
- API Gateway: `http://localhost:4000`

## Prereqs

- Node 18+
- Postgres (2 DBs: one for auth, one for resources)
- Redis (for pub/sub)

## Setup

### 1) Install deps

From each service folder:

- `npm install`

### 2) Create DBs + run SQL

Auth DB (Postgres):

- run `auth-service/sql/001_init.sql`

Resource DB (Postgres):

- run `resource-service/sql/001_init.sql`

If you prefer Docker, make sure **Docker Desktop is running**, then you can do:

```bash
docker run -d --name day4-redis -p 6379:6379 redis:7-alpine
docker run -d --name day4-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 postgres:16-alpine
```

Then create DBs + apply schema:

```bash
docker exec -i day4-postgres psql -U postgres -c "CREATE DATABASE day4_auth;"
docker exec -i day4-postgres psql -U postgres -c "CREATE DATABASE day4_resource;"
docker exec -i day4-postgres psql -U postgres -d day4_auth < auth-service/sql/001_init.sql
docker exec -i day4-postgres psql -U postgres -d day4_resource < resource-service/sql/001_init.sql
```

### 3) Configure env

Copy the `.env.example` in each service to `.env` and fill values.

### 4) Run

Start services in 3 terminals:

- Auth: `npm run dev`
- Resource: `npm run dev`
- Gateway: `npm run dev`

## Quick demo (end-to-end)

1) Login via gateway:

- `POST http://localhost:4000/auth/login`
- body: `{ "email": "demo@example.com", "password": "password123" }`

2) Create a resource via gateway (uses token):

- `POST http://localhost:4000/api/resources`
- header: `Authorization: Bearer <accessToken>`
- body: `{ "name": "first resource" }`

3) Check audit logs (from auth service):

- `GET http://localhost:4000/auth/audit`
- header: `Authorization: Bearer <accessToken>`

You should see an entry mentioning `resource.created`.

## Responsibilities (short)

- **Gateway**: verifies token, adds `x-user-id`, proxies to downstream, normalizes errors.
- **Auth**: issues tokens, stores users, subscribes to `resource.created`, writes audits.
- **Resource**: stores resources, publishes `resource.created` after insert.

