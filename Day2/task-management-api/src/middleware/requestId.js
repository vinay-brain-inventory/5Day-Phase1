import crypto from 'crypto';

export function requestIdMiddleware(request, response, next) {
  const incoming = request.header('x-request-id');
  const requestId = incoming && incoming.length <= 128 ? incoming : crypto.randomUUID();

  request.requestId = requestId;
  response.setHeader('x-request-id', requestId);
  next();
}

