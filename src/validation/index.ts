import { Joi } from 'express-validation';

export const stringValidation: ReturnType<typeof Joi.string> = Joi.string()
  .trim()
  .strict(true)
  .required();

export const emailValidation: ReturnType<typeof Joi.string> = Joi.string()
  .email()
  .trim()
  .strict(true)
  .required();

export const passwordValidation: ReturnType<typeof Joi.string> = Joi.string()
  .min(8)
  .max(100)
  .trim()
  .strict(true)
  .required();
