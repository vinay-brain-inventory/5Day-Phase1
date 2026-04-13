const jwt = require("jsonwebtoken")
const crypto = require("crypto")

function nowSeconds() {
  return Math.floor(Date.now() / 1000)
}

function ttlSeconds(value, fallback) {
  const n = Number(value)
  if (!Number.isFinite(n) || n <= 0) return fallback
  return Math.floor(n)
}

function signAccessToken({ userId, email }, cfg) {
  const ttl = ttlSeconds(cfg.ACCESS_TOKEN_TTL_SECONDS, 900)
  const payload = { sub: String(userId), email }
  return jwt.sign(payload, cfg.JWT_ACCESS_SECRET, { expiresIn: ttl })
}

function signRefreshToken({ userId }, cfg) {
  const ttl = ttlSeconds(cfg.REFRESH_TOKEN_TTL_SECONDS, 60 * 60 * 24 * 14)
  const jti = crypto.randomBytes(16).toString("hex")
  const payload = { sub: String(userId), jti, iat: nowSeconds() }
  const token = jwt.sign(payload, cfg.JWT_REFRESH_SECRET, { expiresIn: ttl })
  const expiresAt = new Date(Date.now() + ttl * 1000)
  return { token, jti, expiresAt }
}

function verifyAccessToken(token, cfg) {
  return jwt.verify(token, cfg.JWT_ACCESS_SECRET)
}

function verifyRefreshToken(token, cfg) {
  return jwt.verify(token, cfg.JWT_REFRESH_SECRET)
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex")
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken
}

