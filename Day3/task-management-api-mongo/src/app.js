import express from 'express';
import mongoose from 'mongoose';
import { buildCors, buildHelmet, buildRateLimiter } from './config/security.js';
import { redis } from './config/redis.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { httpLogger } from './middleware/httpLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { tasksRouter } from './routes/tasks.routes.js';
import { authRouter } from './routes/auth.routes.js';
import { analyticsRouter } from './routes/analytics.routes.js';

export function buildApp() {
  const app = express();

  app.disable('x-powered-by');

  app.use(requestIdMiddleware);
  app.use(httpLogger);

  app.use(buildHelmet());
  app.use(buildCors());
  app.use(buildRateLimiter());

  app.use(express.json({ limit: '100kb' }));

  app.get('/health', async (request, response) => {
    const mongoOk = mongoose.connection.readyState === 1;
    let redisOk = false;
    try {
      redisOk = (await redis.ping()) === 'PONG';
    } catch {
      redisOk = false;
    }

    const ok = mongoOk && redisOk;
    return response.status(ok ? 200 : 503).json({
      ok,
      mongo: mongoOk ? 'ok' : 'down',
      redis: redisOk ? 'ok' : 'down',
      requestId: request.requestId
    });
  });

  app.use('/auth', authRouter);
  app.use('/tasks', tasksRouter);
  app.use('/analytics', analyticsRouter);

  app.use(errorHandler);
  return app;
}

