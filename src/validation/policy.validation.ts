import type { ValidationSchema } from '@/types';
import { stringValidation } from '@/validation';
import { Joi } from 'express-validation';

export type PolicyValidation = {
  createPolicy: ReturnType<typeof import('@/function/validator').default>;
  updatePolicy: ReturnType<typeof import('@/function/validator').default>;
  deletePolicy: ReturnType<typeof import('@/function/validator').default>;
  getPolicy: ReturnType<typeof import('@/function/validator').default>;
  listPolicies: ReturnType<typeof import('@/function/validator').default>;
};

export const createPolicyValidation: ValidationSchema = {
  body: Joi.object({
    name: stringValidation,
    type: stringValidation.valid('RED', 'BLUE', 'AGENTIC').required(),
    description: stringValidation.allow(null).optional(),
    defaultDetector: Joi.boolean().allow(null).optional(),
    detectorIds: Joi.array().items(stringValidation).allow(null).optional(),
    categoryIds: Joi.array().items(stringValidation).allow(null).optional(),

    // Anonymize configuration
    anonymize: Joi.boolean().allow(null).optional(),
    anonymizeType: Joi.array().items(stringValidation).allow(null).optional(),
    anonymizeHiddenNames: Joi.array().items(stringValidation).allow(null).optional(),
    anonymizeAllowedNames: Joi.array().items(stringValidation).allow(null).optional(),
    anonymizePreamble: stringValidation.allow(null).optional(),
    anonymizeUseFaker: Joi.boolean().allow(null).optional(),
    anonymizeThreshold: Joi.number().min(0).max(1).allow(null).optional(),

    // Ban code configuration
    banCode: Joi.boolean().allow(null).optional(),
    banCodeThreshold: Joi.number().min(0).max(1).allow(null).optional(),

    // Ban competitors configuration
    banCompetitors: Joi.boolean().allow(null).optional(),
    banCompetitorsThreshold: Joi.number().min(0).max(1).allow(null).optional(),
    banCompetitorsCompetitors: Joi.array().items(stringValidation).allow(null).optional(),

    // Ban substrings configuration
    banSubstrings: Joi.boolean().allow(null).optional(),
    banSubstringsSubstrings: Joi.array().items(stringValidation).allow(null).optional(),
    banSubstringsMatchType: stringValidation.allow(null).optional(),
    banSubstringsCaseSensitive: Joi.boolean().allow(null).optional(),
    banSubstringsRedact: Joi.boolean().allow(null).optional(),
    banSubstringsContainsAll: Joi.boolean().allow(null).optional(),

    // Ban topics configuration
    banTopics: Joi.boolean().allow(null).optional(),
    banTopicsThreshold: Joi.number().min(0).max(1).allow(null).optional(),
    banTopicsTopics: Joi.array().items(stringValidation).allow(null).optional(),

    // Code configuration
    code: Joi.boolean().allow(null).optional(),
    codeLanguages: Joi.array().items(stringValidation).allow(null).optional(),
    codeIsBlocked: Joi.boolean().allow(null).optional(),

    // Gibberish configuration
    gibberish: Joi.boolean().allow(null).optional(),
    gibberishThreshold: Joi.number().min(0).max(1).allow(null).optional(),
    gibberishMatchType: stringValidation.allow(null).optional(),

    // Language configuration
    language: Joi.boolean().allow(null).optional(),
    languageValidLanguages: Joi.array().items(stringValidation).allow(null).optional(),
    languageMatchType: stringValidation.allow(null).optional(),

    // Prompt injection configuration
    promptInjection: Joi.boolean().allow(null).optional(),
    promptInjectionThreshold: Joi.number().min(0).max(1).allow(null).optional(),
    promptInjectionMatchType: stringValidation.allow(null).optional(),

    // Regex configuration
    regex: Joi.boolean().allow(null).optional(),
    regexPatterns: Joi.array().items(stringValidation).allow(null).optional(),
    regexIsBlocked: Joi.boolean().allow(null).optional(),
    regexRedact: Joi.boolean().allow(null).optional(),

    // Secrets configuration
    secrets: Joi.boolean().allow(null).optional(),
    secretsRedactMode: stringValidation.allow(null).optional(),

    // Sentiment configuration
    sentiment: Joi.boolean().allow(null).optional(),
    sentimentThreshold: Joi.number().min(0).max(1).allow(null).optional(),
    sentimentMatchType: stringValidation.allow(null).optional(),

    // Token limit configuration
    tokenLimit: Joi.boolean().allow(null).optional(),
    tokenLimitLimit: Joi.number().integer().min(1).allow(null).optional(),
    tokenLimitEncodingName: stringValidation.allow(null).optional(),

    // Toxicity configuration
    toxicity: Joi.boolean().allow(null).optional(),
    toxicityThreshold: Joi.number().min(0).max(1).allow(null).optional(),
    toxicityMatchType: stringValidation.allow(null).optional(),
  }),
};

export const updatePolicyValidation: ValidationSchema = {
  params: Joi.object({
    id: stringValidation,
  }),
  body: Joi.object({
    name: stringValidation,
    description: stringValidation.allow(null).optional(),
    defaultDetector: Joi.boolean().allow(null).optional(),
    detectorIds: Joi.array().items(stringValidation).allow(null).optional(),
    categoryIds: Joi.array().items(stringValidation).allow(null).optional(),

    // Anonymize configuration
    anonymize: Joi.boolean().allow(null).optional(),
    anonymizeType: Joi.array().items(stringValidation).allow(null).optional(),
    anonymizeHiddenNames: Joi.array().items(stringValidation).allow(null).optional(),
    anonymizeAllowedNames: Joi.array().items(stringValidation).allow(null).optional(),
    anonymizePreamble: stringValidation.allow(null).optional(),
    anonymizeUseFaker: Joi.boolean().allow(null).optional(),
    anonymizeThreshold: Joi.number().min(0).max(1).allow(null).optional(),

    // Ban code configuration
    banCode: Joi.boolean().allow(null).optional(),
    banCodeThreshold: Joi.number().min(0).max(1).allow(null).optional(),

    // Ban competitors configuration
    banCompetitors: Joi.boolean().allow(null).optional(),
    banCompetitorsThreshold: Joi.number().min(0).max(1).allow(null).optional(),
    banCompetitorsCompetitors: Joi.array().items(stringValidation).allow(null).optional(),

    // Ban substrings configuration
    banSubstrings: Joi.boolean().allow(null).optional(),
    banSubstringsSubstrings: Joi.array().items(stringValidation).allow(null).optional(),
    banSubstringsMatchType: stringValidation.allow(null).optional(),
    banSubstringsCaseSensitive: Joi.boolean().allow(null).optional(),
    banSubstringsRedact: Joi.boolean().allow(null).optional(),
    banSubstringsContainsAll: Joi.boolean().allow(null).optional(),

    // Ban topics configuration
    banTopics: Joi.boolean().allow(null).optional(),
    banTopicsThreshold: Joi.number().min(0).max(1).allow(null).optional(),
    banTopicsTopics: Joi.array().items(stringValidation).allow(null).optional(),

    // Code configuration
    code: Joi.boolean().allow(null).optional(),
    codeLanguages: Joi.array().items(stringValidation).allow(null).optional(),
    codeIsBlocked: Joi.boolean().allow(null).optional(),

    // Gibberish configuration
    gibberish: Joi.boolean().allow(null).optional(),
    gibberishThreshold: Joi.number().min(0).max(1).allow(null).optional(),
    gibberishMatchType: stringValidation.allow(null).optional(),

    // Language configuration
    language: Joi.boolean().allow(null).optional(),
    languageValidLanguages: Joi.array().items(stringValidation).allow(null).optional(),
    languageMatchType: stringValidation.allow(null).optional(),

    // Prompt injection configuration
    promptInjection: Joi.boolean().allow(null).optional(),
    promptInjectionThreshold: Joi.number().min(0).max(1).allow(null).optional(),
    promptInjectionMatchType: stringValidation.allow(null).optional(),

    // Regex configuration
    regex: Joi.boolean().allow(null).optional(),
    regexPatterns: Joi.array().items(stringValidation).allow(null).optional(),
    regexIsBlocked: Joi.boolean().allow(null).optional(),
    regexRedact: Joi.boolean().allow(null).optional(),

    // Secrets configuration
    secrets: Joi.boolean().allow(null).optional(),
    secretsRedactMode: stringValidation.allow(null).optional(),

    // Sentiment configuration
    sentiment: Joi.boolean().allow(null).optional(),
    sentimentThreshold: Joi.number().min(0).max(1).allow(null).optional(),
    sentimentMatchType: stringValidation.allow(null).optional(),

    // Token limit configuration
    tokenLimit: Joi.boolean().allow(null).optional(),
    tokenLimitLimit: Joi.number().integer().min(1).allow(null).optional(),
    tokenLimitEncodingName: stringValidation.allow(null).optional(),

    // Toxicity configuration
    toxicity: Joi.boolean().allow(null).optional(),
    toxicityThreshold: Joi.number().min(0).max(1).allow(null).optional(),
    toxicityMatchType: stringValidation.allow(null).optional(),
  }),
};

export const deletePolicyValidation: ValidationSchema = {
  params: Joi.object({
    id: stringValidation,
  }),
};

export const getPolicyValidation: ValidationSchema = {
  params: Joi.object({
    id: stringValidation,
  }),
};

export const listPoliciesValidation: ValidationSchema = {
  query: Joi.object({
    page: stringValidation.optional(),
    limit: stringValidation.optional(),
  }),
  body: Joi.object({
    search: stringValidation.optional(),
    field: stringValidation.valid('name', 'description').optional(),
    sort: stringValidation.valid('asc', 'desc').optional(),
    defaultDetector: Joi.boolean().optional(),
    startDate: stringValidation.optional(),
    endDate: stringValidation.optional(),
    dateField: stringValidation.valid('createdAt', 'updatedAt').optional(),
    sortBy: stringValidation.valid('name', 'createdAt', 'updatedAt').optional(),
  }),
};
