import pinoHttp from 'pino-http';
import { logger } from '../utils/logger.js';

export const httpLogger = pinoHttp({
  logger,
  genReqId: (request, response) => request.requestId,
  customProps: (request) => ({ requestId: request.requestId })
});

