import crypto from 'crypto';

function base64UrlEncodeJson(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function base64UrlDecodeJson(value) {
  return JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
}

function signHmacSha256Base64Url(secret, value) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

export function signJwt({ secret, payload, expiresInSeconds, nowSeconds = Math.floor(Date.now() / 1000) }) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = nowSeconds + expiresInSeconds;
  const fullPayload = { ...payload, iat: nowSeconds, exp };

  const encodedHeader = base64UrlEncodeJson(header);
  const encodedPayload = base64UrlEncodeJson(fullPayload);
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = signHmacSha256Base64Url(secret, signingInput);
  return `${signingInput}.${signature}`;
}

export function verifyJwt({ secret, token, nowSeconds = Math.floor(Date.now() / 1000) }) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token format');

  const [encodedHeader, encodedPayload, signature] = parts;
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = signHmacSha256Base64Url(secret, signingInput);

  const a = Buffer.from(signature);
  const b = Buffer.from(expectedSignature);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) throw new Error('Invalid token signature');

  const header = base64UrlDecodeJson(encodedHeader);
  if (header?.alg !== 'HS256' || header?.typ !== 'JWT') throw new Error('Invalid token header');

  const payload = base64UrlDecodeJson(encodedPayload);
  if (typeof payload?.exp !== 'number') throw new Error('Invalid token payload');
  if (payload.exp <= nowSeconds) throw new Error('Token expired');

  return payload;
}

