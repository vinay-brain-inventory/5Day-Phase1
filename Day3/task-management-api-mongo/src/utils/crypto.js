import crypto from 'crypto';

export function sha256Base64Url(input) {
  return crypto.createHash('sha256').update(input).digest('base64url');
}

