import validator from '@/function/validator';
import type { ValidationSchema } from '@/types';
import { stringValidation } from '@/validation';
import { Joi } from 'express-validation';

export type ProjectValidation = {
  createProject: ReturnType<typeof validator>;
  updateProject: ReturnType<typeof validator>;
  deleteProject: ReturnType<typeof validator>;
  getProject: ReturnType<typeof validator>;
  listProjects: ReturnType<typeof validator>;
};

export const createProjectValidation: ValidationSchema = {
  body: Joi.object({
    name: stringValidation.required(),
    description: stringValidation.allow(null).optional(),
    type: stringValidation.valid('RED', 'BLUE', 'AGENTIC').required(),
    policyId: stringValidation.allow(null).optional(),
    redModelType: stringValidation
      .valid(
        'REST',
        'OPENAI',
        'HUGGING_FAVE',
        'HUGGING_FACE_INFERENCE_API',
        'HUGGING_FACE_INFERENCE_ENDPOINT',
        'REPLICATE',
        'COHERE',
        'GROQ',
        'NIM',
        'GGML'
      )
      .allow(null)
      .optional(),
    redModelName: stringValidation.allow(null).optional(),
    redModelUrl: stringValidation.allow(null).optional(),
    redModelToken: stringValidation.allow(null).optional(),
    redAuthorizationType: stringValidation
      .valid('BEARER', 'API_KEY', 'NONE')
      .allow(null)
      .optional(),
    redRequestTemplate: Joi.object().allow(null).optional(),
    agenticZipUrl: stringValidation.allow(null).optional(),
    blueDomain: stringValidation.allow(null).optional(),
  }),
};

export const updateProjectValidation: ValidationSchema = {
  params: Joi.object({
    id: stringValidation.required(),
  }),
  body: Joi.object({
    name: stringValidation.allow(null).optional(),
    description: stringValidation.allow(null).optional(),
    type: stringValidation.valid('RED', 'BLUE', 'AGENTIC').allow(null).optional(),
    policyId: stringValidation.allow(null).optional(),
    redModelType: stringValidation
      .valid(
        'REST',
        'OPENAI',
        'HUGGING_FAVE',
        'HUGGING_FACE_INFERENCE_API',
        'HUGGING_FACE_INFERENCE_ENDPOINT',
        'REPLICATE',
        'COHERE',
        'GROQ',
        'NIM',
        'GGML'
      )
      .allow(null)
      .optional(),
    redModelName: stringValidation.allow(null).optional(),
    redModelUrl: stringValidation.allow(null).optional(),
    redModelToken: stringValidation.allow(null).optional(),
    redAuthorizationType: stringValidation
      .valid('BEARER', 'API_KEY', 'NONE')
      .allow(null)
      .optional(),
    redRequestTemplate: Joi.object().allow(null).optional(),
    agenticZipUrl: stringValidation.allow(null).optional(),
    blueDomain: stringValidation.allow(null).optional(),
  }),
};

export const deleteProjectValidation: ValidationSchema = {
  params: Joi.object({
    id: stringValidation,
  }),
};

export const getProjectValidation: ValidationSchema = {
  params: Joi.object({
    id: stringValidation,
  }),
};

export const listProjectsValidation: ValidationSchema = {
  query: Joi.object({
    page: stringValidation.optional(),
    limit: stringValidation.optional(),
  }),
  body: Joi.object({
    search: stringValidation.optional(),
    field: stringValidation.optional(),
    sort: stringValidation.optional(),
    type: stringValidation.valid('RED', 'BLUE', 'AGENTIC').optional(),
    startDate: stringValidation.optional(),
    endDate: stringValidation.optional(),
    dateField: stringValidation.optional(),
    sortBy: stringValidation.optional(),
  }),
};
