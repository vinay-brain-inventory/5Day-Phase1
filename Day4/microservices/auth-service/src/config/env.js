import dotenv from 'dotenv';

dotenv.config();

function mustGet(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

export const env = {
  port: Number(process.env.PORT || 4001),
  databaseUrl: mustGet('DATABASE_URL'),
  jwtAccessSecret: mustGet('JWT_ACCESS_SECRET'),
  redisUrl: mustGet('REDIS_URL'),
};

