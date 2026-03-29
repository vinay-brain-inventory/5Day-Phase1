import { env } from '../config/env.js';
import { findUserByEmail } from '../models/user.model.js';
import { findRefreshTokenByHash, insertRefreshToken, revokeRefreshToken} from '../models/refreshToken.model.js';
import { sha256Base64Url } from '../utils/crypto.js';
import { signJwt, verifyJwt } from '../utils/jwt.js';
import { pool } from '../config/db.js';
import crypto from 'crypto';

export async function login(request, response) {
  const { email, password } = request.validatedBody;

  const user = await findUserByEmail(email);
  if (!user) return response.status(401).json({ error: 'InvalidCredentials' });

  const pwCheck = await pool.query( 'SELECT (password_hash = crypt($1, password_hash)) AS ok FROM users WHERE id = $2', [password, user.id] );
  if (!pwCheck.rows[0]?.ok) return response.status(401).json({ error: 'InvalidCredentials' });

  const accessToken = signJwt({
    secret: env.jwtAccessSecret,
    payload: { sub: user.id },
    expiresInSeconds: env.accessTokenTtlSeconds
  });

  const refreshTokenId = crypto.randomUUID();
  const refreshToken = signJwt({
    secret: env.jwtRefreshSecret,
    payload: { sub: user.id, jti: refreshTokenId, typ: 'refresh' },
    expiresInSeconds: env.refreshTokenTtlSeconds
  });
  const refreshTokenHash = sha256Base64Url(refreshToken);

  const expiresAt = new Date(Date.now() + env.refreshTokenTtlSeconds * 1000);
  await insertRefreshToken({
    id: refreshTokenId,
    userId: user.id,
    tokenHash: refreshTokenHash,
    expiresAt,
    userAgent: request.header('user-agent'),
    ip: request.ip
  });

  return response.json({
    accessToken,
    refreshToken,
    tokenType: 'Bearer',
    expiresIn: env.accessTokenTtlSeconds
  });
}

export async function refresh(request, response) {
  const { refreshToken } = request.validatedBody;

  let refreshPayload;
  try {
    refreshPayload = verifyJwt({ secret: env.jwtRefreshSecret, token: refreshToken });
    if (refreshPayload?.typ !== 'refresh') return response.status(401).json({ error: 'Unauthorized' });
    if (!refreshPayload?.sub || !refreshPayload?.jti) return response.status(401).json({ error: 'Unauthorized' });
  } catch {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  const tokenHash = sha256Base64Url(refreshToken);
  const existing = await findRefreshTokenByHash(tokenHash);
  if (!existing) return response.status(401).json({ error: 'Unauthorized' });
  if (existing.id !== refreshPayload.jti) return response.status(401).json({ error: 'Unauthorized' });
  if (existing.user_id !== refreshPayload.sub) return response.status(401).json({ error: 'Unauthorized' });
  if (existing.revoked_at) return response.status(401).json({ error: 'Unauthorized' });
  if (new Date(existing.expires_at).getTime() <= Date.now()) return response.status(401).json({ error: 'Unauthorized' });

  const newAccessToken = signJwt({
    secret: env.jwtAccessSecret,
    payload: { sub: existing.user_id },
    expiresInSeconds: env.accessTokenTtlSeconds
  });

  const newRefreshTokenId = crypto.randomUUID();
  const newRefreshToken = signJwt({
    secret: env.jwtRefreshSecret,
    payload: { sub: existing.user_id, jti: newRefreshTokenId, typ: 'refresh' },
    expiresInSeconds: env.refreshTokenTtlSeconds
  });
  const newRefreshTokenHash = sha256Base64Url(newRefreshToken);
  const newExpiresAt = new Date(Date.now() + env.refreshTokenTtlSeconds * 1000);
  const inserted = await insertRefreshToken({
    id: newRefreshTokenId,
    userId: existing.user_id,
    tokenHash: newRefreshTokenHash,
    expiresAt: newExpiresAt,
    userAgent: request.header('user-agent'),
    ip: request.ip
  });

  await revokeRefreshToken({ tokenId: existing.id, replacedByTokenId: inserted.id });
  return response.json({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    tokenType: 'Bearer',
    expiresIn: env.accessTokenTtlSeconds
  });
}

