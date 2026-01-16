import Joi from 'joi';

export const getTokenSchema = Joi.object({
  code: Joi.string().required(),
  codeVerifier: Joi.string().required(),
});
