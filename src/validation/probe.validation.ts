import validator from '@/function/validator';
import type { ValidationSchema } from '@/types';
import { stringValidation } from '@/validation';
import { Joi } from 'express-validation';

export type ProbeValidation = {
  createProbe: ReturnType<typeof validator>;
  updateProbe: ReturnType<typeof validator>;
  deleteProbe: ReturnType<typeof validator>;
  getProbe: ReturnType<typeof validator>;
  listProbes: ReturnType<typeof validator>;
};

export const createProbeValidation: ValidationSchema = {
  body: Joi.object({
    probeId: stringValidation,
    name: stringValidation,
    description: stringValidation.optional(),
  }),
};

export const updateProbeValidation: ValidationSchema = {
  params: Joi.object({
    id: stringValidation,
  }),
  body: Joi.object({
    probeId: stringValidation.optional(),
    name: stringValidation.optional(),
    description: stringValidation.optional(),
  }),
};

export const deleteProbeValidation: ValidationSchema = {
  params: Joi.object({
    id: stringValidation,
  }),
};

export const getProbeValidation: ValidationSchema = {
  params: Joi.object({
    id: stringValidation,
  }),
};

export const listProbesValidation: ValidationSchema = {
  query: Joi.object({
    page: stringValidation.optional(),
    limit: stringValidation.optional(),
  }),
  body: Joi.object({
    search: stringValidation.optional(),
    field: stringValidation.optional(),
    sort: stringValidation.optional(),
    startDate: stringValidation.optional(),
    endDate: stringValidation.optional(),
    dateField: stringValidation.optional(),
    sortBy: stringValidation.optional(),
  }),
};

export const getProbeDropdownValidation: ValidationSchema = {};
