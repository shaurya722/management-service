import constant from '@/constant';
import sendRes from '@/function/sendRes';
import validator from '@/function/validator';
import {
  createPolicy,
  deletePolicy,
  getBuiltInPolicies,
  getPolicy,
  getPolicyDropdown,
  listPolicies,
  updatePolicy,
} from '@/models/policy.model';
import catchAsync from '@/utils/catchAsync';
import { AppError, isAppError } from '@/utils/customErrors';
import type { PolicyValidation } from '@/validation/policy.validation';
import {
  createPolicyValidation,
  deletePolicyValidation,
  getPolicyValidation,
  listPoliciesValidation,
  updatePolicyValidation,
} from '@/validation/policy.validation';

export const validation: PolicyValidation = {
  createPolicy: validator(createPolicyValidation),
  updatePolicy: validator(updatePolicyValidation),
  deletePolicy: validator(deletePolicyValidation),
  getPolicy: validator(getPolicyValidation),
  listPolicies: validator(listPoliciesValidation),
};

export const createPolicyController = catchAsync(async (req, res, next) => {
  const {
    name,
    description,
    type,
    defaultDetector,
    detectorIds,
    categoryIds,

    // Anonymize configuration
    anonymize,
    anonymizeType,
    anonymizeHiddenNames,
    anonymizeAllowedNames,
    anonymizePreamble,
    anonymizeUseFaker,
    anonymizeThreshold,

    // Ban code configuration
    banCode,
    banCodeThreshold,

    // Ban competitors configuration
    banCompetitors,
    banCompetitorsThreshold,
    banCompetitorsCompetitors,

    // Ban substrings configuration
    banSubstrings,
    banSubstringsSubstrings,
    banSubstringsMatchType,
    banSubstringsCaseSensitive,
    banSubstringsRedact,
    banSubstringsContainsAll,

    // Ban topics configuration
    banTopics,
    banTopicsThreshold,
    banTopicsTopics,

    // Code configuration
    code,
    codeLanguages,
    codeIsBlocked,

    // Gibberish configuration
    gibberish,
    gibberishThreshold,
    gibberishMatchType,

    // Language configuration
    language,
    languageValidLanguages,
    languageMatchType,

    // Prompt injection configuration
    promptInjection,
    promptInjectionThreshold,
    promptInjectionMatchType,

    // Regex configuration
    regex,
    regexPatterns,
    regexIsBlocked,
    regexRedact,

    // Secrets configuration
    secrets,
    secretsRedactMode,

    // Sentiment configuration
    sentiment,
    sentimentThreshold,
    sentimentMatchType,

    // Token limit configuration
    tokenLimit,
    tokenLimitLimit,
    tokenLimitEncodingName,

    // Toxicity configuration
    toxicity,
    toxicityThreshold,
    toxicityMatchType,
  } = req.body || {};

  if (!name) {
    return next(AppError('Policy name is required', 400));
  }
  if (!type) {
    return next(AppError('Policy type is required', 400));
  }
  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const newPolicy = await createPolicy({
    name,
    description,
    type,
    defaultDetector,
    detectorIds: detectorIds || undefined,
    categoryIds: categoryIds || undefined,

    // Anonymize configuration
    anonymize,
    anonymizeType,
    anonymizeHiddenNames,
    anonymizeAllowedNames,
    anonymizePreamble,
    anonymizeUseFaker,
    anonymizeThreshold,

    // Ban code configuration
    banCode,
    banCodeThreshold,

    // Ban competitors configuration
    banCompetitors,
    banCompetitorsThreshold,
    banCompetitorsCompetitors,

    // Ban substrings configuration
    banSubstrings,
    banSubstringsSubstrings,
    banSubstringsMatchType,
    banSubstringsCaseSensitive,
    banSubstringsRedact,
    banSubstringsContainsAll,

    // Ban topics configuration
    banTopics,
    banTopicsThreshold,
    banTopicsTopics,

    // Code configuration
    code,
    codeLanguages,
    codeIsBlocked,

    // Gibberish configuration
    gibberish,
    gibberishThreshold,
    gibberishMatchType,

    // Language configuration
    language,
    languageValidLanguages,
    languageMatchType,

    // Prompt injection configuration
    promptInjection,
    promptInjectionThreshold,
    promptInjectionMatchType,

    // Regex configuration
    regex,
    regexPatterns,
    regexIsBlocked,
    regexRedact,

    // Secrets configuration
    secrets,
    secretsRedactMode,

    // Sentiment configuration
    sentiment,
    sentimentThreshold,
    sentimentMatchType,

    // Token limit configuration
    tokenLimit,
    tokenLimitLimit,
    tokenLimitEncodingName,

    // Toxicity configuration
    toxicity,
    toxicityThreshold,
    toxicityMatchType,

    tenantId: req.user.tenantId,
  });

  if (isAppError(newPolicy)) return next(newPolicy);

  return sendRes({
    data: { policy: newPolicy },
    status: constant.SUCCESS,
    res,
    message: constant.DATA_CREATED(constant.MODULE.POLICY()),
    options: { showData: true },
  });
});

export const updatePolicyController = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const {
    name,
    description,
    type,
    defaultDetector,
    detectorIds,
    categoryIds,

    // Anonymize configuration
    anonymize,
    anonymizeType,
    anonymizeHiddenNames,
    anonymizeAllowedNames,
    anonymizePreamble,
    anonymizeUseFaker,
    anonymizeThreshold,

    // Ban code configuration
    banCode,
    banCodeThreshold,

    // Ban competitors configuration
    banCompetitors,
    banCompetitorsThreshold,
    banCompetitorsCompetitors,

    // Ban substrings configuration
    banSubstrings,
    banSubstringsSubstrings,
    banSubstringsMatchType,
    banSubstringsCaseSensitive,
    banSubstringsRedact,
    banSubstringsContainsAll,

    // Ban topics configuration
    banTopics,
    banTopicsThreshold,
    banTopicsTopics,

    // Code configuration
    code,
    codeLanguages,
    codeIsBlocked,

    // Gibberish configuration
    gibberish,
    gibberishThreshold,
    gibberishMatchType,

    // Language configuration
    language,
    languageValidLanguages,
    languageMatchType,

    // Prompt injection configuration
    promptInjection,
    promptInjectionThreshold,
    promptInjectionMatchType,

    // Regex configuration
    regex,
    regexPatterns,
    regexIsBlocked,
    regexRedact,

    // Secrets configuration
    secrets,
    secretsRedactMode,

    // Sentiment configuration
    sentiment,
    sentimentThreshold,
    sentimentMatchType,

    // Token limit configuration
    tokenLimit,
    tokenLimitLimit,
    tokenLimitEncodingName,

    // Toxicity configuration
    toxicity,
    toxicityThreshold,
    toxicityMatchType,
  } = req.body || {};

  if (!id) {
    return next(AppError('Policy ID is required', 400));
  }
  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const updatedPolicy = await updatePolicy({
    id,
    name,
    description,
    type,
    defaultDetector,
    detectorIds,
    categoryIds,

    // Anonymize configuration
    anonymize,
    anonymizeType,
    anonymizeHiddenNames,
    anonymizeAllowedNames,
    anonymizePreamble,
    anonymizeUseFaker,
    anonymizeThreshold,

    // Ban code configuration
    banCode,
    banCodeThreshold,

    // Ban competitors configuration
    banCompetitors,
    banCompetitorsThreshold,
    banCompetitorsCompetitors,

    // Ban substrings configuration
    banSubstrings,
    banSubstringsSubstrings,
    banSubstringsMatchType,
    banSubstringsCaseSensitive,
    banSubstringsRedact,
    banSubstringsContainsAll,

    // Ban topics configuration
    banTopics,
    banTopicsThreshold,
    banTopicsTopics,

    // Code configuration
    code,
    codeLanguages,
    codeIsBlocked,

    // Gibberish configuration
    gibberish,
    gibberishThreshold,
    gibberishMatchType,

    // Language configuration
    language,
    languageValidLanguages,
    languageMatchType,

    // Prompt injection configuration
    promptInjection,
    promptInjectionThreshold,
    promptInjectionMatchType,

    // Regex configuration
    regex,
    regexPatterns,
    regexIsBlocked,
    regexRedact,

    // Secrets configuration
    secrets,
    secretsRedactMode,

    // Sentiment configuration
    sentiment,
    sentimentThreshold,
    sentimentMatchType,

    // Token limit configuration
    tokenLimit,
    tokenLimitLimit,
    tokenLimitEncodingName,

    // Toxicity configuration
    toxicity,
    toxicityThreshold,
    toxicityMatchType,

    tenantId: req.user.tenantId,
  });

  if (isAppError(updatedPolicy)) return next(updatedPolicy);

  return sendRes({
    data: { policy: updatedPolicy },
    status: constant.SUCCESS,
    res,
    message: constant.DATA_UPDATED(constant.MODULE.POLICY()),
    options: { showData: true },
  });
});

export const deletePolicyController = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(AppError('Policy ID is required', 400));
  }
  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const result = await deletePolicy({
    id,
    tenantId: req.user.tenantId,
  });

  if (isAppError(result)) return next(result);

  return sendRes({
    data: result,
    status: constant.SUCCESS,
    res,
    message: constant.DATA_DELETED(constant.MODULE.POLICY()),
    options: { showData: true },
  });
});

export const getPolicyController = catchAsync(async (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    return next(AppError('Policy ID is required', 400));
  }
  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const policy = await getPolicy({
    id,
    tenantId: req.user.tenantId,
  });

  if (isAppError(policy)) return next(policy);

  return sendRes({
    data: policy,
    status: constant.SUCCESS,
    res,
    message: constant.DATA_RETRIEVED(constant.MODULE.POLICY()),
    options: { showData: true },
  });
});

export const listPoliciesController = catchAsync(async (req, res, next) => {
  const { page = '1', limit = '10' } = req.query;
  const { search, field, sort, defaultDetector, startDate, endDate, dateField, sortBy } =
    req.body || {};

  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const data = await listPolicies({
    page: Number(page),
    limit: Number(limit),
    search,
    field,
    sort,
    defaultDetector,
    startDate,
    endDate,
    dateField,
    sortBy,
    tenantId: req.user.tenantId,
  });

  if (isAppError(data)) return next(data);

  return sendRes({
    data,
    status: constant.SUCCESS,
    res,
    message: constant.DATA_RETRIEVED(constant.MODULE.POLICY()),
    options: { showData: true },
  });
});

export const getPolicyDropdownController = catchAsync(async (req, res, next) => {
  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const policies = await getPolicyDropdown(req.user.tenantId);

  if (isAppError(policies)) return next(policies);

  return sendRes({
    data: { policies },
    status: constant.SUCCESS,
    res,
    message: constant.DATA_RETRIEVED(constant.MODULE.POLICY()),
    options: { showData: true },
  });
});

export const getBuiltInPoliciesController = catchAsync(async (req, res, next) => {
  if (!req.user.tenantId) return next(AppError(constant.USER_NOT_FOUND(), constant.BAD_REQUEST));

  const policies = await getBuiltInPolicies(req.user.tenantId);

  if (isAppError(policies)) return next(policies);

  return sendRes({
    data: { policies },
    status: constant.SUCCESS,
    res,
    message: constant.DATA_RETRIEVED(constant.MODULE.POLICY()),
    options: { showData: true },
  });
});
