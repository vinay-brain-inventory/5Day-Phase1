import { env } from '../config/env.js';
import { verifyJwt } from '../utils/jwt.js';

export function requireAuth(request, response, next) {
  const header = request.header('authorization');
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  const token = header.slice('bearer '.length).trim();
  try {
    const payload = verifyJwt({ secret: env.jwtAccessSecret, token });
    request.auth = { userId: payload.sub };
    next();
  } catch {
    return response.status(401).json({ error: 'Unauthorized' });
  }
}

