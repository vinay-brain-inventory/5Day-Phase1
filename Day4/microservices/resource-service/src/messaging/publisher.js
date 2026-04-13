import Redis from 'ioredis';
import { env } from '../config/env.js';

let pub;

export function getPublisher() {
  if (!pub) {
    pub = new Redis(env.redisUrl);
    pub.on('error', (err) => {
      console.error('[redis]', err?.message || err);
    });
  }
  return pub;
}

export async function publishResourceCreated({ userId, resourceId, name }) {
  const publisher = getPublisher();
  const payload = JSON.stringify({ userId, resourceId, name });
  await publisher.publish('resource.created', payload);
}

