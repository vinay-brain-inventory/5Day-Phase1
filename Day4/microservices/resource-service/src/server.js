import http from 'http';
import { buildApp } from './app.js';
import { env } from './config/env.js';
import { pool } from './config/db.js';
import { getPublisher } from './messaging/publisher.js';

const app = buildApp();
const server = http.createServer(app);

server.listen(env.port, () => {
  console.log(`[resource] listening on :${env.port}`);
  // init redis connection early so errors show up immediately
  getPublisher();
});

async function gracefulShutdown(signal) {
  console.log('[resource] graceful shutdown start', signal);
  await new Promise((resolve) => server.close(() => resolve()));

  try {
    const pub = getPublisher();
    pub.disconnect();
  } catch {}

  await pool.end();
  console.log('[resource] graceful shutdown complete');
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

