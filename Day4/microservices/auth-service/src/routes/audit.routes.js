import { Router } from 'express';
import { pool } from '../config/db.js';
import { getUserIdFromRequest } from '../middleware/gatewayAuth.js';

export const auditRouter = Router();

auditRouter.get('/audit', async (req, res, next) => {
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      const err = new Error('Unauthorized');
      err.statusCode = 401;
      throw err;
    }

    const result = await pool.query(
      'SELECT id, at, user_id, action, details FROM audit_logs ORDER BY id DESC LIMIT 50'
    );
    res.json({ items: result.rows });
  } catch (e) {
    next(e);
  }
});

