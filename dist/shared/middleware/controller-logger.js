export function withControllerLogging(handler, operationName) {
    return async (req, res, next) => {
        const op = operationName || handler.name || 'controller';
        const log = req.log || console;
        try {
            log.info({ op }, 'controller_start');
            const result = await handler(req, res, next);
            log.info({ op }, 'controller_success');
            return result;
        }
        catch (error) {
            log.error({ op, err: error?.message }, 'controller_error');
            return next(error);
        }
    };
}
