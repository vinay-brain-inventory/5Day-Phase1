import dotenv from 'dotenv';

dotenv.config();

function mustGet(name) {
  const value = process.env[name];
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

export const env = {
  port: Number(process.env.PORT || 4002),
  databaseUrl: mustGet('DATABASE_URL'),
  redisUrl: mustGet('REDIS_URL'),
};

