import dotenv from 'dotenv';

dotenv.config();

function mustGet(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

export const env = {
  port: Number(process.env.PORT || 4000),
  authServiceUrl: mustGet('AUTH_SERVICE_URL').replace(/\/+$/, ''),
  resourceServiceUrl: mustGet('RESOURCE_SERVICE_URL').replace(/\/+$/, ''),
  jwtAccessSecret: mustGet('JWT_ACCESS_SECRET'),
};

