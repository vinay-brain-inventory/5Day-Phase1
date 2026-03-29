import http from 'http';
import { buildApp } from './app.js';
import { env } from './config/env.js';
import { pool } from './config/db.js';
import { logger } from './utils/logger.js';

const app = buildApp();
const server = http.createServer(app);
server.listen(env.port, () => { logger.info({ port: env.port }, 'server listening')});

async function gracefulShutdown(signal) {
  logger.info({ signal }, 'graceful shutdown start');
  await new Promise((resolve) => { server.close(() => resolve()); });

  await pool.end();
  logger.info('graceful shutdown complete');
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

