import { ValidationSchema } from '@/types';
import { EvOptions as SchemaOptions, validate as expressValidate } from 'express-validation';

import { RequestHandler } from 'express';

type Validate = (schema: ValidationSchema, options?: SchemaOptions) => RequestHandler;

export const validator: Validate = (schema, options = {}) =>
  expressValidate(
    schema,
    { ...options, context: true },
    { abortEarly: false }
  ) as unknown as RequestHandler;

export default validator;
