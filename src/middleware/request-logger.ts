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

  child.info({ headers: req.headers }, 'incoming_request');

  res.on('finish', () => {
    const durationMs = Date.now() - startTimeMs;
    const contentLength = res.get('content-length');
    child.info({ statusCode: res.statusCode, durationMs, contentLength }, 'request_complete');
  });

  res.on('close', () => {
    const durationMs = Date.now() - startTimeMs;
    child.warn({ durationMs }, 'request_aborted');
  });

  next();
}

