import { Router } from 'express';
import { pool } from '../config/db.js';
import { publishResourceCreated } from '../messaging/publisher.js';

export const resourcesRouter = Router();

resourcesRouter.get('/resources', async (req, res, next) => {
  try {
    const userId = Number(req.auth.userId);
    const result = await pool.query(
      'SELECT id, user_id, name, created_at FROM resources WHERE user_id = $1 ORDER BY id DESC LIMIT 50',
      [userId]
    );
    res.json({ items: result.rows });
  } catch (e) {
    next(e);
  }
});

resourcesRouter.post('/resources', async (req, res, next) => {
  try {
    const userId = Number(req.auth.userId);
    const { name } = req.body || {};
    if (!name) {
      const err = new Error('name is required');
      err.statusCode = 400;
      throw err;
    }

    const result = await pool.query(
      'INSERT INTO resources (user_id, name) VALUES ($1, $2) RETURNING id, user_id, name, created_at',
      [userId, String(name)]
    );

    const created = result.rows[0];

    // Publish after insert; if redis is down, the resource still exists.
    publishResourceCreated({ userId: created.user_id, resourceId: created.id, name: created.name })
      .catch((e) => console.error('[pubsub]', e?.message || e));

    res.status(201).json(created);
  } catch (e) {
    next(e);
  }
});

