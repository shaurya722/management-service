import validator from '@/function/validator';
import type { ValidationSchema } from '@/types';
import { stringValidation } from '@/validation';
import { Joi } from 'express-validation';

export type CompanyValidation = {
  approveCompany: ReturnType<typeof validator>;
  rejectCompany: ReturnType<typeof validator>;
  deleteCompany: ReturnType<typeof validator>;
  listCompany: ReturnType<typeof validator>;
};

export const approveCompanyValidation: ValidationSchema = {
  body: Joi.object({
    id: stringValidation,
  }),
};

export const rejectCompanyValidation: ValidationSchema = {
  body: Joi.object({
    id: stringValidation,
    reason: stringValidation,
  }),
};

export const deleteCompanyValidation: ValidationSchema = {
  params: Joi.object({
    id: stringValidation,
  }),
};

export const listCompanyValidation: ValidationSchema = {
  query: Joi.object({
    page: stringValidation,
    limit: stringValidation,
  }),
  body: Joi.object({
    search: stringValidation.optional(),
    field: stringValidation.optional(),
    sort: stringValidation.optional(),
    status: stringValidation.optional(),
    startDate: stringValidation.optional(),
    endDate: stringValidation.optional(),
    dateField: stringValidation.optional(),
    sortBy: stringValidation.optional(),
  }),
};
