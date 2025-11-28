import il8n from '@/function/il8n';

const HTTP_RESPONSE = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

const MESSAGES = {
  API_HANDSHAKE: () => il8n.t('MESSAGES.API_HANDSHAKE'),
  API_HANDSHAKE_ADMIN: () => il8n.t('MESSAGES.API_HANDSHAKE_ADMIN'),
  API_HANDSHAKE_COMPANY: () => il8n.t('MESSAGES.API_HANDSHAKE_COMPANY'),
  HEALTH_CHECK: () => il8n.t('MESSAGES.HEALTH_CHECK'),
} as const;

const ERRORS = {
  INVALID_CREDENTIALS: () => il8n.t('ERRORS.INVALID_CREDENTIALS'),
  USER_NOT_FOUND: () => il8n.t('ERRORS.USER_NOT_FOUND'),
  USER_ALREADY_EXISTS: () => il8n.t('ERRORS.USER_ALREADY_EXISTS'),
  EMAIL_NOT_VERIFIED: () => il8n.t('ERRORS.EMAIL_NOT_VERIFIED'),
  INVALID_TOKEN: () => il8n.t('ERRORS.INVALID_TOKEN'),
  TOKEN_EXPIRED: () => il8n.t('ERRORS.TOKEN_EXPIRED'),
  PASSWORD_RESET_FAILED: () => il8n.t('ERRORS.PASSWORD_RESET_FAILED'),
  EMAIL_VERIFICATION_FAILED: () => il8n.t('ERRORS.EMAIL_VERIFICATION_FAILED'),
  EMAIL_VERIFICATION_TOKEN_EXPIRED: () => il8n.t('ERRORS.EMAIL_VERIFICATION_TOKEN_EXPIRED'),
  EMAIL_VERIFICATION_TOKEN_INVALID: () => il8n.t('ERRORS.EMAIL_VERIFICATION_TOKEN_INVALID'),
  EMAIL_VERIFICATION_TOKEN_ALREADY_USED: () =>
    il8n.t('ERRORS.EMAIL_VERIFICATION_TOKEN_ALREADY_USED'),
  EMAIL_VERIFICATION_TOKEN_NOT_FOUND: () => il8n.t('ERRORS.EMAIL_VERIFICATION_TOKEN_NOT_FOUND'),
} as const;

const FUNCTIONS = {
  ROUTE_NOT_FOUND: (url: string) => il8n.t('FUNCTIONS.ROUTE_NOT_FOUND', { url }),
  FORMAT: (prefix: string) => prefix.toUpperCase().replace(/\s/g, '_'),
} as const;

const DATA = {
  DATA_CREATED: (Data: string): string => il8n.t('DATA.DATA_CREATED', { Data }),
  DATA_UPDATED: (Data: string): string => il8n.t('DATA.DATA_UPDATED', { Data }),
  DATA_DELETED: (Data: string): string => il8n.t('DATA.DATA_DELETED', { Data }),
  DATA_NOT_FOUND: (Data: string): string => il8n.t('DATA.DATA_NOT_FOUND', { Data }),
  DATA_RETRIEVED: (Data: string): string => il8n.t('DATA.DATA_RETRIEVED', { Data }),
  DATA_CUSTOM: (MODULE: string, ...path: string[]): string => il8n.t(`${MODULE}.${path.join('.')}`),
} as const;

const MODULE = {
  PROFILE: () => il8n.t('MODULE.PROFILE'),
  COMPANY: () => il8n.t('MODULE.COMPANY'),
  DETECTOR: () => il8n.t('MODULE.DETECTOR'),
  PROBE: () => il8n.t('MODULE.PROBE'),
  CATEGORY: () => il8n.t('MODULE.CATEGORY'),
  POLICY: () => il8n.t('MODULE.POLICY'),
  PROJECT: () => il8n.t('MODULE.PROJECT'),
  JOB: () => il8n.t('MODULE.JOB'),
  LOG: () => il8n.t('MODULE.LOG'),
} as const;

const constant = {
  ...HTTP_RESPONSE,
  ...MESSAGES,
  ...ERRORS,
  ...FUNCTIONS,
  ...DATA,
  MODULE,
};

export default constant;
