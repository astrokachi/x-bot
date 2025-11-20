import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<any> | any;

export function withControllerLogging(handler: AsyncHandler, operationName?: string): RequestHandler {
  return async (req, res, next) => {
    const op = operationName || handler.name || 'controller';
    const log = (req as any).log || console;

    try {
      log.info({ op }, 'controller_start');
      const result = await handler(req, res, next);
      log.info({ op }, 'controller_success');
      return result;
    } catch (error: any) {
      log.error({ op, err: error?.message }, 'controller_error');
      return next(error);
    }
  };
}


