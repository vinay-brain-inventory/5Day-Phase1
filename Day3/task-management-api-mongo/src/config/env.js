import dotenv from 'dotenv';

dotenv.config();

function required(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3001),

  mongoUri: required('MONGODB_URI'),
  mongoMinPoolSize: Number(process.env.MONGODB_MIN_POOL_SIZE ?? 2),
  mongoMaxPoolSize: Number(process.env.MONGODB_MAX_POOL_SIZE ?? 10),

  redisUrl: required('REDIS_URL'),

  corsOrigin: process.env.CORS_ORIGIN ?? '*',

  jwtAccessSecret: required('JWT_ACCESS_SECRET'),
  jwtRefreshSecret: required('JWT_REFRESH_SECRET'),
  accessTokenTtlSeconds: Number(process.env.ACCESS_TOKEN_TTL_SECONDS ?? 60 * 15),
  refreshTokenTtlSeconds: Number(process.env.REFRESH_TOKEN_TTL_SECONDS ?? 60 * 60 * 24 * 14)
};

