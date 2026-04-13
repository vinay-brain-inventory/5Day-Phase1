import { Router } from 'express';
import { pool } from '../config/db.js';
import { env } from '../config/env.js';
import { signJwt } from '../utils/jwt.js';

export const authRouter = Router();

authRouter.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      const err = new Error('email and password are required');
      err.statusCode = 400;
      throw err;
    }

    const result = await pool.query('SELECT id, email, password_hash FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user || user.password_hash !== password) {
      const err = new Error('Invalid credentials');
      err.statusCode = 401;
      throw err;
    }

    const accessToken = signJwt({
      secret: env.jwtAccessSecret,
      payload: { sub: String(user.id) },
      expiresInSeconds: 60 * 60,
    });

    res.json({ accessToken });
  } catch (e) {
    next(e);
  }
});

