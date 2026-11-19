import crypto from 'crypto';

// Small structured logger: one JSON line per event keeps hosting logs searchable
// without pulling a logging stack into the app.
const write = (level, message, meta = {}) => {
  const line = JSON.stringify({
    time: new Date().toISOString(),
    level,
    message,
    ...meta,
  });
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
};

const logger = {
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta),
};

// Every request gets an id that also travels back in the response header, so a
// reported failure can be found in the logs.
export const requestId = (req, res, next) => {
  const incoming = req.headers['x-request-id'];
  req.id = typeof incoming === 'string' && incoming.length <= 100 ? incoming : crypto.randomUUID();
  res.set('X-Request-Id', req.id);
  const started = Date.now();
  res.on('finish', () => {
    if (req.path === '/api/health') return;
    logger.info('request', {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      ms: Date.now() - started,
      ip: req.ip,
    });
  });
  next();
};

export default logger;
