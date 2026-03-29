import pinoHttp from 'pino-http';
import { logger } from '../utils/logger.js';

export const httpLogger = pinoHttp({
  logger,
  genReqId: (request) => request.requestId,
  serializers: {
    req: (req) => ({
      id: req.id,
      method: req.method,
      url: req.url,
      ip: req.remoteAddress ?? req.socket?.remoteAddress,
      userAgent: req.headers?.['user-agent']
    }),
    res: (res) => ({
      statusCode: res.statusCode
    })
  },
  customProps: (request) => ({ requestId: request.requestId })
});

