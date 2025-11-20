import 'express';
import type pino from 'pino';

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
    log?: pino.Logger;
  }
}

import type { Logger } from 'pino';

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      log?: Logger;
    }
  }
}

export {};

