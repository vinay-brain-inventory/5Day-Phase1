import Redis from 'ioredis';
import { env } from './env.js';

export const redis = new Redis(env.redisUrl, {
  lazyConnect: true,
  maxRetriesPerRequest: 1,
  enableOfflineQueue: false,
  connectTimeout: 2_000
});

export async function connectRedis() {
  if (redis.status === 'ready') return;
  await redis.connect();
}

export async function disconnectRedis() {
  try {
    await redis.quit();
  } catch {
    redis.disconnect();
  }
}

