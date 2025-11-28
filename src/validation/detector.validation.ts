import validator from '@/function/validator';
import type { ValidationSchema } from '@/types';
import { stringValidation } from '@/validation';
import { Joi } from 'express-validation';

export type DetectorValidation = {
  createDetector: ReturnType<typeof validator>;
  updateDetector: ReturnType<typeof validator>;
  deleteDetector: ReturnType<typeof validator>;
  getDetector: ReturnType<typeof validator>;
  listDetectors: ReturnType<typeof validator>;
};

export const createDetectorValidation: ValidationSchema = {
  body: Joi.object({
    detectorName: stringValidation,
    description: stringValidation.optional(),
    detectorType: stringValidation.valid('REGEX', 'HEURISTIC', 'PII'),
    confidence: Joi.number().min(0).max(1).required(),
    regex: Joi.array().items(stringValidation).allow(null).optional(),
  }),
};

export const updateDetectorValidation: ValidationSchema = {
  params: Joi.object({
    id: stringValidation,
  }),
  body: Joi.object({
    detectorName: stringValidation.optional(),
    description: stringValidation.optional(),
    detectorType: stringValidation.valid('REGEX', 'HEURISTIC', 'PII').optional(),
    confidence: Joi.number().min(0).max(1).optional(),
    regex: Joi.array().items(stringValidation).allow(null).optional(),
  }),
};

export const deleteDetectorValidation: ValidationSchema = {
  params: Joi.object({
    id: stringValidation,
  }),
};

export const getDetectorValidation: ValidationSchema = {
  params: Joi.object({
    id: stringValidation,
  }),
};

export const listDetectorsValidation: ValidationSchema = {
  query: Joi.object({
    page: stringValidation.optional(),
    limit: stringValidation.optional(),
  }),
  body: Joi.object({
    search: stringValidation.optional(),
    field: stringValidation.optional(),
    sort: stringValidation.optional(),
    creationType: stringValidation.valid('BuiltIn', 'External').optional(),
    detectorType: stringValidation.valid('REGEX', 'HEURISTIC', 'PII').optional(),
    startDate: stringValidation.optional(),
    endDate: stringValidation.optional(),
    dateField: stringValidation.optional(),
    sortBy: stringValidation.optional(),
  }),
};

export const getDetectorDropdownValidation: ValidationSchema = {};
