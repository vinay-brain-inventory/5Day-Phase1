export function requireGatewayUser(req, res, next) {
  const userId = req.header('x-user-id');
  if (!userId) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Unauthorized' },
    });
  }

  req.auth = { userId: String(userId) };
  next();
}

