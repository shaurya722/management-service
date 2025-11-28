import { Joi } from 'express-validation';

export type IApiResponse = {
  success: boolean;
  message: string;
  data?: unknown;
  error?: unknown;
};

export type IAppError = Error & { statusCode: number };

export type ValidationSchema = Record<
  string,
  ReturnType<typeof Joi.object | typeof Joi.alternatives>
>;
