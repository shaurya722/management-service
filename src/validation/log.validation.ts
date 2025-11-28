import validator from '@/function/validator';
import type { ValidationSchema } from '@/types';
import { stringValidation } from '@/validation';
import { Joi } from 'express-validation';

export type LogValidation = {
  listLogs: ReturnType<typeof validator>;
  getLog: ReturnType<typeof validator>;
};

export const listLogsValidation: ValidationSchema = {
  body: Joi.object({
    type: stringValidation.valid('BLUE', 'RED').required(),
    status: stringValidation.optional(),
    isFail: Joi.boolean().optional(),
    sortBy: Joi.string().valid('createdAt', 'status', 'isFail').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  }),
};

export const getLogValidation: ValidationSchema = {
  params: Joi.object({
    id: stringValidation,
  }),
  query: Joi.object({
    type: stringValidation.valid('BLUE', 'RED').required(),
  }),
};

export const getLogsByJobValidation: ValidationSchema = {
  params: Joi.object({
    jobId: stringValidation,
  }),
  query: Joi.object({
    page: Joi.number().integer().min(1).optional(),
    limit: Joi.number().integer().min(1).max(100).optional(),
  }),
  body: Joi.object({
    type: stringValidation.valid('BLUE', 'RED').required(),
    status: stringValidation.optional(),
    isFail: Joi.boolean().optional(),
    sortBy: Joi.string().valid('createdAt', 'status', 'isFail').optional(),
    sortOrder: Joi.string().valid('asc', 'desc').optional(),
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().optional(),
  }),
};
