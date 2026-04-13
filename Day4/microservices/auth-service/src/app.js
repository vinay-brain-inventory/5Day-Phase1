import express from 'express';
import { authRouter } from './routes/auth.routes.js';
import { auditRouter } from './routes/audit.routes.js';

export function buildApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (req, res) => res.json({ ok: true }));

  app.use('/auth', authRouter);
  app.use('/auth', auditRouter);

  // keep errors boring + consistent
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err?.statusCode || 500;
    res.status(status).json({
      error: {
        code: err?.code || (status >= 500 ? 'INTERNAL' : 'BAD_REQUEST'),
        message: err?.message || 'Something went wrong',
      },
    });
  });

  return app;
}

