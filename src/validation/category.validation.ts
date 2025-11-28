import validator from '@/function/validator';
import type { ValidationSchema } from '@/types';
import { stringValidation } from '@/validation';
import { Joi } from 'express-validation';

export type CategoryValidation = {
  createCategory: ReturnType<typeof validator>;
  updateCategory: ReturnType<typeof validator>;
  deleteCategory: ReturnType<typeof validator>;
  getCategory: ReturnType<typeof validator>;
  listCategories: ReturnType<typeof validator>;
};

export const createCategoryValidation: ValidationSchema = {
  body: Joi.object({
    name: stringValidation,
    description: stringValidation.optional(),
    probes: Joi.array().items(stringValidation).optional(),
  }),
};

export const updateCategoryValidation: ValidationSchema = {
  params: Joi.object({
    id: stringValidation,
  }),
  body: Joi.object({
    name: stringValidation.optional(),
    description: stringValidation.optional(),
    probes: Joi.array().items(stringValidation).optional(),
  }),
};

export const deleteCategoryValidation: ValidationSchema = {
  params: Joi.object({
    id: stringValidation,
  }),
};

export const getCategoryValidation: ValidationSchema = {
  params: Joi.object({
    id: stringValidation,
  }),
};

export const listCategoriesValidation: ValidationSchema = {
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

export const getCategoryDropdownValidation: ValidationSchema = {};

export const getBuiltInCategoriesValidation: ValidationSchema = {};

export const getCategoryTypesValidation: ValidationSchema = {};
