import { logger } from '../utils/logger.js';
function generateRequestId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
export function requestLogger(req, res, next) {
    const startTimeMs = Date.now();
    const requestId = req.headers['x-request-id'] || generateRequestId();
    req.requestId = requestId;
    const child = logger.child({ requestId, method: req.method, path: req.originalUrl || req.url });
    req.log = child;
    res.on('finish', () => {
        const durationMs = Date.now() - startTimeMs;
        const contentLength = res.get('content-length');
    });
    res.on('close', () => {
        const durationMs = Date.now() - startTimeMs;
    });
    next();
}
