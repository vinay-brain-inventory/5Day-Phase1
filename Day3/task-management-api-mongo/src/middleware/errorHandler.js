import { logger } from '../utils/logger.js';

export function errorHandler(error, request, response, next) {
  void next;

  const statusCode = typeof error?.statusCode === 'number' ? error.statusCode : 500;
  const safeMessage = statusCode >= 500 ? 'InternalServerError' : (error?.message ?? 'RequestError');

  logger.error(
    { requestId: request.requestId, err: { message: error?.message, stack: error?.stack } },
    'request failed'
  );

  response.status(statusCode).json({ error: safeMessage, requestId: request.requestId });
}

