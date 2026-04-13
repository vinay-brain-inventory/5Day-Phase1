import Redis from 'ioredis';
import { env } from '../config/env.js';
import { pool } from '../config/db.js';

export async function startSubscriber() {
  const sub = new Redis(env.redisUrl);

  sub.on('error', (err) => {
    // don't crash the whole service on noisy redis events
    console.error('[redis]', err?.message || err);
  });

  await sub.subscribe('resource.created');

  sub.on('message', async (channel, message) => {
    if (channel !== 'resource.created') return;

    let payload;
    try {
      payload = JSON.parse(message);
    } catch {
      return;
    }

    const { userId, resourceId, name } = payload || {};
    if (!userId || !resourceId) return;

    try {
      await pool.query(
        'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
        [Number(userId), 'resource.created', { resourceId, name }]
      );
    } catch (e) {
      console.error('[audit]', e?.message || e);
    }
  });

  return sub;
}

