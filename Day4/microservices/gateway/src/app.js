import express from 'express';
import { env } from './config/env.js';
import { maybeRequireAuth } from './middleware/auth.js';
import { forwardRequest } from './proxy/forward.js';

export function buildApp() {
  const app = express();
  app.disable('x-powered-by');

  app.get('/health', (req, res) => res.json({ ok: true }));

  app.use(maybeRequireAuth);

  app.use('/auth', (req, res) => {
    forwardRequest({
      targetBaseUrl: env.authServiceUrl,
      req,
      res,
      extraHeaders: req.auth?.userId ? { 'x-user-id': req.auth.userId } : {},
    });
  });

  app.use('/api', (req, res) => {
    forwardRequest({
      targetBaseUrl: env.resourceServiceUrl,
      req,
      res,
      extraHeaders: req.auth?.userId ? { 'x-user-id': req.auth.userId } : {},
    });
  });

  app.use((req, res) => {
    res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Not found' },
    });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    res.status(500).json({
      error: { code: 'INTERNAL', message: err?.message || 'Something went wrong' },
    });
  });

  return app;
}

