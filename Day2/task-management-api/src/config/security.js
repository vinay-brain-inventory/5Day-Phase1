import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { env } from './env.js';

export function buildHelmet() {
  return helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false });
}

export function buildCors() {
  return cors({
    origin: env.corsOrigin === '*' ? true : env.corsOrigin,
    credentials: false,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id']
  });
}

export function buildRateLimiter() {
  return rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false  });
}

