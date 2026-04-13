import http from 'http';
import { buildApp } from './app.js';
import { env } from './config/env.js';

const app = buildApp();
const server = http.createServer(app);

server.listen(env.port, () => {
  console.log(`[gateway] listening on :${env.port}`);
});

async function gracefulShutdown(signal) {
  console.log('[gateway] graceful shutdown start', signal);
  await new Promise((resolve) => server.close(() => resolve()));
  console.log('[gateway] graceful shutdown complete');
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

