import crypto from 'crypto';
import { env } from '../config/env.js';
import { User } from '../models/user.model.js';
import { RefreshToken } from '../models/refreshToken.model.js';
import { sha256Base64Url } from '../utils/crypto.js';
import { signJwt, verifyJwt } from '../utils/jwt.js';

export async function login(request, response) {
  const { email, password } = request.validatedBody;

  const user = await User.findOne({ email: email.toLowerCase() }).lean();
  if (!user) return response.status(401).json({ error: 'InvalidCredentials' });

  // Simple password check for the exercise: store SHA-256(password) as passwordHash.
  // (In real systems you should use a slow KDF like bcrypt/argon2.)
  const pwHash = sha256Base64Url(password);
  if (user.passwordHash !== pwHash) return response.status(401).json({ error: 'InvalidCredentials' });

  const accessToken = signJwt({
    secret: env.jwtAccessSecret,
    payload: { sub: String(user._id) },
    expiresInSeconds: env.accessTokenTtlSeconds
  });

  const refreshTokenId = crypto.randomUUID();
  const refreshToken = signJwt({
    secret: env.jwtRefreshSecret,
    payload: { sub: String(user._id), jti: refreshTokenId, typ: 'refresh' },
    expiresInSeconds: env.refreshTokenTtlSeconds
  });

  const refreshTokenHash = sha256Base64Url(refreshToken);
  const expiresAt = new Date(Date.now() + env.refreshTokenTtlSeconds * 1000);

  await RefreshToken.create({
    _id: refreshTokenId,
    userId: String(user._id),
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

  let payload;
  try {
    payload = verifyJwt({ secret: env.jwtRefreshSecret, token: refreshToken });
    if (payload?.typ !== 'refresh') return response.status(401).json({ error: 'Unauthorized' });
    if (!payload?.sub || !payload?.jti) return response.status(401).json({ error: 'Unauthorized' });
  } catch {
    return response.status(401).json({ error: 'Unauthorized' });
  }

  const tokenHash = sha256Base64Url(refreshToken);
  const existing = await RefreshToken.findOne({ tokenHash }).lean();
  if (!existing) return response.status(401).json({ error: 'Unauthorized' });
  if (existing.revokedAt) return response.status(401).json({ error: 'Unauthorized' });
  if (existing._id !== payload.jti) return response.status(401).json({ error: 'Unauthorized' });
  if (existing.userId !== payload.sub) return response.status(401).json({ error: 'Unauthorized' });
  if (existing.expiresAt.getTime() <= Date.now()) return response.status(401).json({ error: 'Unauthorized' });

  const newAccessToken = signJwt({
    secret: env.jwtAccessSecret,
    payload: { sub: existing.userId },
    expiresInSeconds: env.accessTokenTtlSeconds
  });

  const newRefreshTokenId = crypto.randomUUID();
  const newRefreshToken = signJwt({
    secret: env.jwtRefreshSecret,
    payload: { sub: existing.userId, jti: newRefreshTokenId, typ: 'refresh' },
    expiresInSeconds: env.refreshTokenTtlSeconds
  });

  const newRefreshTokenHash = sha256Base64Url(newRefreshToken);
  const newExpiresAt = new Date(Date.now() + env.refreshTokenTtlSeconds * 1000);

  await RefreshToken.create({
    _id: newRefreshTokenId,
    userId: existing.userId,
    tokenHash: newRefreshTokenHash,
    expiresAt: newExpiresAt,
    userAgent: request.header('user-agent'),
    ip: request.ip
  });

  await RefreshToken.updateOne(
    { _id: existing._id, revokedAt: null },
    { $set: { revokedAt: new Date(), replacedByTokenId: newRefreshTokenId } }
  );

  return response.json({
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
    tokenType: 'Bearer',
    expiresIn: env.accessTokenTtlSeconds
  });
}

