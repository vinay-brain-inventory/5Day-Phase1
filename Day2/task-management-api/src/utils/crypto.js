import crypto from 'crypto';

export function sha256Base64Url(input) {
  return crypto.createHash('sha256').update(input).digest('base64url');
}

export function randomTokenBase64Url(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

