import { env } from '../config/env.js';
import { verifyJwt } from '../utils/jwt.js';

export function getUserIdFromRequest(req) {
  const fromGateway = req.header('x-user-id');
  if (fromGateway) return String(fromGateway);

  const header = req.header('authorization');
  if (!header || !header.toLowerCase().startsWith('bearer ')) return null;

  const token = header.slice('bearer '.length).trim();
  try {
    const payload = verifyJwt({ secret: env.jwtAccessSecret, token });
    return String(payload.sub);
  } catch {
    return null;
  }
}

