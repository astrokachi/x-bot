import 'express';
import 'express-session';
import type pino from 'pino';
import type { Logger } from 'pino';

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
    log?: pino.Logger;
  }
}

declare module "express-session" {
  interface SessionData {
    codeVerifier?: string;
    tokens: {
      accessToken?: string;
      refreshToken?: string;
    }
  }
}

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      log?: Logger;
    }
  }
}

export { };

