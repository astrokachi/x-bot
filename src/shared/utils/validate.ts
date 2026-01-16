import Joi from "joi";

export function validate<T>(schema: Joi.Schema, data: unknown): T {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    throw error;
  }
  return value as T;
}
