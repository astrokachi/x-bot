import Joi from 'joi';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { validate } from '../../shared/utils/validate.js';

export const oAuthCallbackSchema = Joi.object({
  code: Joi.string().required(),
  codeVerifier: Joi.string().required(),
  // userId: Joi.string().required().messages({
  //  'any.required': 'Session expired. Please try connecting again.',
  //  'string.empty': 'Session expired. Please try connecting again.'
  // }),
});

export const registerSchema = Joi.object({
  email: Joi.string().email(),
  password: Joi.string().min(8).required(),
  name: Joi.string().optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const validateAuthCallback: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    validate(oAuthCallbackSchema, {
      code: req.query.code,
      codeVerifier: req.session.codeVerifier,
      userId: req.session.userId
    });
    next();
  } catch (error) {
    next(error);
  }
};

export const validateBody = (schema: Joi.Schema): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      validate(schema, req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};

