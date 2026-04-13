import http from 'http';
import { buildApp } from './app.js';
import { env } from './config/env.js';
import { pool } from './config/db.js';
import { startSubscriber } from './messaging/subscriber.js';

const app = buildApp();
const server = http.createServer(app);

let redisSub;

server.listen(env.port, async () => {
  console.log(`[auth] listening on :${env.port}`);
  try {
    redisSub = await startSubscriber();
    console.log('[auth] redis subscriber started');
  } catch (e) {
    console.log('[auth] redis subscriber failed to start:', e?.message || e);
  }
});

async function gracefulShutdown(signal) {
  console.log('[auth] graceful shutdown start', signal);
  await new Promise((resolve) => server.close(() => resolve()));

  if (redisSub) {
    try { redisSub.disconnect(); } catch {}
  }

  await pool.end();
  console.log('[auth] graceful shutdown complete');
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

