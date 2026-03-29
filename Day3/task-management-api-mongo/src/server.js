import http from 'http';
import { buildApp } from './app.js';
import { env } from './config/env.js';
import { connectMongo, disconnectMongo } from './config/mongo.js';
import { connectRedis, disconnectRedis } from './config/redis.js';
import { logger } from './utils/logger.js';

await connectMongo();
await connectRedis();

const app = buildApp();
const server = http.createServer(app);

server.listen(env.port, () => {
  logger.info({ port: env.port }, 'server listening');
});

async function gracefulShutdown(signal) {
  logger.info({ signal }, 'graceful shutdown start');
  await new Promise((resolve) => server.close(() => resolve()));
  await disconnectRedis();
  await disconnectMongo();
  logger.info('graceful shutdown complete');
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

