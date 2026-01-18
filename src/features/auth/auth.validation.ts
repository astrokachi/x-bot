import Joi from 'joi';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { validate } from '../../shared/utils/validate.js';

export const getTokenSchema = Joi.object({
  code: Joi.string().required(),
  codeVerifier: Joi.string().required(),
});

export const validateAuthCallback = (schema: Joi.Schema): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      validate(schema, {
        code: req.query.code,
        codeVerifier: req.session.codeVerifier
      });
      next();
    } catch (error) {
      next(error);
    }
  };
};
