import { env } from '../config/env.js';
import { verifyJwt } from '../utils/jwt.js';

export function maybeRequireAuth(req, res, next) {
  // public:
  // - POST /auth/login
  if (req.path === '/auth/login' && req.method === 'POST') return next();

  // protect everything else behind gateway in this day
  const header = req.header('authorization');
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
  }

  const token = header.slice('bearer '.length).trim();
  try {
    const payload = verifyJwt({ secret: env.jwtAccessSecret, token });
    req.auth = { userId: String(payload.sub) };
    next();
  } catch {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
  }
}

