import { Request, Response, NextFunction } from 'express';
import { logger } from '../lib/logger.js';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const { method, url } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const contentLength = res.get('content-length') || 0;

    logger.info({
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      contentLength: `${contentLength}B`,
      userAgent: req.headers['user-agent'] || '-',
      ip: req.ip || req.socket.remoteAddress,
    }, `${method} ${url} ${statusCode} ${duration}ms`);
  });

  next();
}
