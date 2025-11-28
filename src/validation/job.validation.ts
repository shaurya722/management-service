import validator from '@/function/validator';
import type { ValidationSchema } from '@/types';
import { stringValidation } from '@/validation';
import { Joi } from 'express-validation';

export type JobValidation = {
  createJob: ReturnType<typeof validator>;
  updateJob: ReturnType<typeof validator>;
  deleteJob: ReturnType<typeof validator>;
  getJob: ReturnType<typeof validator>;
  listJobs: ReturnType<typeof validator>;
  getJobReport: ReturnType<typeof validator>;
};

export const createJobValidation: ValidationSchema = {
  body: Joi.object({
    projectId: stringValidation.required(),
    redAuthorizationValue: stringValidation.allow(null).optional(),
    evaluationThreshold: Joi.number().min(0).max(1).allow(null).optional(),
    agenticReport: stringValidation.allow(null).optional(),
  }),
};

export const updateJobValidation: ValidationSchema = {
  params: Joi.object({
    id: stringValidation.required(),
  }),
  body: Joi.object({
    projectId: stringValidation.allow(null).optional(),
    redAuthorizationValue: stringValidation.allow(null).optional(),
    evaluationThreshold: Joi.number().min(0).max(1).allow(null).optional(),
    agenticReport: stringValidation.allow(null).optional(),
  }),
};

export const deleteJobValidation: ValidationSchema = {
  params: Joi.object({
    id: stringValidation.required(),
  }),
};

export const getJobValidation: ValidationSchema = {
  params: Joi.object({
    id: stringValidation.required(),
  }),
};

export const listJobsValidation: ValidationSchema = {
  query: Joi.object({
    page: stringValidation.optional(),
    limit: stringValidation.optional(),
  }),
  body: Joi.object({
    search: stringValidation.allow(null).optional(),
    field: stringValidation.allow(null).optional(),
    sort: stringValidation.allow(null).optional(),
    projectId: stringValidation.allow(null).optional(),
    projectType: stringValidation.valid('RED', 'BLUE', 'AGENTIC').allow(null).optional(),
    status: stringValidation
      .valid('PENDING', 'STARTED', 'SUCCESS', 'RETRY', 'REVOKED', 'FAILURE')
      .allow(null)
      .optional(),
    startDate: stringValidation.allow(null).optional(),
    endDate: stringValidation.allow(null).optional(),
    dateField: stringValidation.allow(null).optional(),
    sortBy: stringValidation.allow(null).optional(),
  }),
};

export const getJobDropdownValidation: ValidationSchema = {};

export const getJobsByProjectValidation: ValidationSchema = {
  params: Joi.object({
    projectId: stringValidation.required(),
  }),
};

export const getJobsByStatusValidation: ValidationSchema = {
  params: Joi.object({
    status: stringValidation
      .valid('PENDING', 'STARTED', 'SUCCESS', 'RETRY', 'REVOKED', 'FAILURE')
      .required(),
  }),
};

export const getJobReportValidation: ValidationSchema = {
  params: Joi.object({
    jobId: stringValidation.required(),
  }),
  query: Joi.object({
    month: Joi.number().integer().min(1).max(12).optional(),
    year: Joi.number().integer().min(2020).max(2030).optional(),
  }),
};
