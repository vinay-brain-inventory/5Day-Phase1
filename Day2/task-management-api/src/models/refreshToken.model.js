import { pool } from '../config/db.js';

export async function insertRefreshToken({ id, userId, tokenHash, expiresAt, userAgent, ip }) {
  const result = await pool.query(
    `INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, user_agent, ip)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, user_id, token_hash, created_at, expires_at, revoked_at, replaced_by_token_id`,
    [id, userId, tokenHash, expiresAt, userAgent ?? null, ip ?? null]
  );
  return result.rows[0];
}

export async function findRefreshTokenByHash(tokenHash) {
  const result = await pool.query(
    `SELECT id, user_id, token_hash, created_at, expires_at, revoked_at, replaced_by_token_id
     FROM refresh_tokens
     WHERE token_hash = $1
     LIMIT 1`,
    [tokenHash]
  );
  return result.rows[0] ?? null;
}

export async function revokeRefreshToken({ tokenId, replacedByTokenId = null }) {
  const result = await pool.query(
    `UPDATE refresh_tokens
     SET revoked_at = now(), replaced_by_token_id = $2
     WHERE id = $1 AND revoked_at IS NULL
     RETURNING id`,
    [tokenId, replacedByTokenId]
  );
  return result.rowCount === 1;
}

