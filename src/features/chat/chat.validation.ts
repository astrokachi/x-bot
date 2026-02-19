import Joi from 'joi';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { validate } from '../../shared/utils/validate.js';

export const promptSchema = Joi.object({
  content: Joi.string().required().min(1),
  title: Joi.string().optional(),
});

export const validatePrompt: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    validate(promptSchema, req.body);
    next();
  } catch (error) {
    next(error);
  }
};
