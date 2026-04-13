import http from 'http';
import https from 'https';

function pickClient(url) {
  if (url.protocol === 'https:') return https;
  return http;
}

export function forwardRequest({ targetBaseUrl, req, res, extraHeaders = {} }) {
  const targetUrl = new URL(req.originalUrl, targetBaseUrl);
  const service = targetUrl.host;

  const client = pickClient(targetUrl);

  const headers = { ...req.headers, ...extraHeaders };
  delete headers.host;

  const proxyReq = client.request(
    targetUrl,
    {
      method: req.method,
      headers,
    },
    (proxyRes) => {
      const contentType = proxyRes.headers['content-type'];
      res.statusCode = proxyRes.statusCode || 500;

      const chunks = [];
      proxyRes.on('data', (c) => chunks.push(c));
      proxyRes.on('end', () => {
        const body = Buffer.concat(chunks);

        const isJson = contentType && contentType.includes('application/json');
        const status = res.statusCode;

        if (status >= 400) {
          let message = body.toString('utf8') || 'Downstream request failed';
          let code = 'DOWNSTREAM_ERROR';

          if (isJson) {
            try {
              const parsed = JSON.parse(message);
              if (parsed?.error?.message) message = parsed.error.message;
              if (parsed?.error?.code) code = parsed.error.code;
            } catch {}
          }

          res.setHeader('content-type', 'application/json');
          res.end(
            JSON.stringify({
              error: { code, message, status, service },
            })
          );
          return;
        }

        // happy path: keep it simple, just pass through
        if (contentType) res.setHeader('content-type', contentType);
        res.end(body);
      });
    }
  );

  proxyReq.on('error', (err) => {
    res.status(502).json({
      error: {
        code: 'BAD_GATEWAY',
        message: err?.message || 'Bad gateway',
      },
    });
  });

  req.pipe(proxyReq);
}

