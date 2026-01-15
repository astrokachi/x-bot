import { NextFunction, Request, Response } from 'express';
import { logger } from '../utils/logger';

function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const startTimeMs = Date.now();
  const requestId = (req.headers['x-request-id'] as string) || generateRequestId();

  (req as any).requestId = requestId;
  const child = logger.child({ requestId, method: req.method, path: req.originalUrl || req.url });
  (req as any).log = child;

  res.on('finish', () => {
    const durationMs = Date.now() - startTimeMs;
    const contentLength = res.get('content-length');
  });

  res.on('close', () => {
    const durationMs = Date.now() - startTimeMs;
  });

  next();
}
