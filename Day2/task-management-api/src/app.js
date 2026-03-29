import express from 'express';
import { buildCors, buildHelmet, buildRateLimiter } from './config/security.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { httpLogger } from './middleware/httpLogger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { tasksRouter } from './routes/tasks.routes.js';
import { authRouter } from './routes/auth.routes.js';

export function buildApp() {
  const app = express();

  app.disable('x-powered-by');

  app.use(requestIdMiddleware);
  app.use(httpLogger);

  app.use(buildHelmet());
  app.use(buildCors());
  app.use(buildRateLimiter());

  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (request, response) => response.json({ ok: true }));

  app.use('/auth', authRouter);
  app.use('/tasks', tasksRouter);

  app.use(errorHandler);

  return app;
}

