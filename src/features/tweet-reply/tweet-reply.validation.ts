import { validateTimeString } from "../../shared/utils/time-parser.js";
import { Request, Response, NextFunction, RequestHandler } from 'express';
import Joi from "joi";
import { validate } from "../../shared/utils/validate.js";

export const tweetReplySchema = Joi.object({
  tweetUrls: Joi.array().items(Joi.string()).min(1),
  customInstructions: Joi.string(),
  maximumTime: Joi.string().trim().lowercase().custom(validateTimeString)
})



export const validateBody = (schema: Joi.Schema): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = validate(schema, req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
};
