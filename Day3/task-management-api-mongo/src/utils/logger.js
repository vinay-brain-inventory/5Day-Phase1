import pino from 'pino';

export const logger = pino({
  level: process.env.NODE_ENV === 'test' ? 'silent' : 'info',
  redact: {
    paths: ['req.headers.authorization', 'req.body.password', 'req.body.refreshToken'],
    remove: true
  }
});

