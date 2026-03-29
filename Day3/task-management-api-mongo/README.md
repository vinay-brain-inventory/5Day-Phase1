# Day 3 — MongoDB + Redis deep dive

This is the Day 2 API moved to MongoDB (Mongoose) with Redis caching.

## Requirements covered

- Mongoose schemas + compound indexes (see `src/models/*.model.js`)
- Aggregation pipeline + `.explain('executionStats')`:
  - `GET /analytics/tasks/status-summary`
  - `GET /analytics/tasks/status-summary/explain`
- Redis cache (60s TTL):
  - caches `GET /tasks` and `GET /tasks/:id`
  - invalidates on `POST/PUT/PATCH/DELETE`
- Pooling:
  - MongoDB `minPoolSize/maxPoolSize` via env
  - Redis fail-fast config (no offline queue)
- Health check:
  - `GET /health` verifies Mongo + Redis

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

## Latency measurement (autocannon)

```bash
npm run bench
```

