import type { Policy } from '@/generated';
import type { IAppError } from '@/types';

export type CreatePolicy = (params: {
  name: string;
  description?: string;
  type: 'RED' | 'BLUE' | 'AGENTIC';
  defaultDetector?: boolean;
  detectorIds?: string[];
  categoryIds?: string[];

  // Anonymize configuration
  anonymize?: boolean;
  anonymizeType?: string[];
  anonymizeHiddenNames?: string[];
  anonymizeAllowedNames?: string[];
  anonymizePreamble?: string;
  anonymizeUseFaker?: boolean;
  anonymizeThreshold?: number;

  // Ban code configuration
  banCode?: boolean;
  banCodeThreshold?: number;

  // Ban competitors configuration
  banCompetitors?: boolean;
  banCompetitorsThreshold?: number;
  banCompetitorsCompetitors?: string[];

  // Ban substrings configuration
  banSubstrings?: boolean;
  banSubstringsSubstrings?: string[];
  banSubstringsMatchType?: string;
  banSubstringsCaseSensitive?: boolean;
  banSubstringsRedact?: boolean;
  banSubstringsContainsAll?: boolean;

  // Ban topics configuration
  banTopics?: boolean;
  banTopicsThreshold?: number;
  banTopicsTopics?: string[];

  // Code configuration
  code?: boolean;
  codeLanguages?: string[];
  codeIsBlocked?: boolean;

  // Gibberish configuration
  gibberish?: boolean;
  gibberishThreshold?: number;
  gibberishMatchType?: string;

  // Language configuration
  language?: boolean;
  languageValidLanguages?: string[];
  languageMatchType?: string;

  // Prompt injection configuration
  promptInjection?: boolean;
  promptInjectionThreshold?: number;
  promptInjectionMatchType?: string;

  // Regex configuration
  regex?: boolean;
  regexPatterns?: string[];
  regexIsBlocked?: boolean;
  regexRedact?: boolean;

  // Secrets configuration
  secrets?: boolean;
  secretsRedactMode?: string;

  // Sentiment configuration
  sentiment?: boolean;
  sentimentThreshold?: number;
  sentimentMatchType?: string;

  // Token limit configuration
  tokenLimit?: boolean;
  tokenLimitLimit?: number;
  tokenLimitEncodingName?: string;

  // Toxicity configuration
  toxicity?: boolean;
  toxicityThreshold?: number;
  toxicityMatchType?: string;

  tenantId: string;
}) => Promise<Policy | IAppError>;

export type UpdatePolicy = (params: {
  id: string;
  name?: string;
  description?: string;
  type?: 'RED' | 'BLUE' | 'AGENTIC';
  defaultDetector?: boolean;
  detectorIds?: string[];
  categoryIds?: string[];

  // Anonymize configuration
  anonymize?: boolean;
  anonymizeType?: string[];
  anonymizeHiddenNames?: string[];
  anonymizeAllowedNames?: string[];
  anonymizePreamble?: string;
  anonymizeUseFaker?: boolean;
  anonymizeThreshold?: number;

  // Ban code configuration
  banCode?: boolean;
  banCodeThreshold?: number;

  // Ban competitors configuration
  banCompetitors?: boolean;
  banCompetitorsThreshold?: number;
  banCompetitorsCompetitors?: string[];

  // Ban substrings configuration
  banSubstrings?: boolean;
  banSubstringsSubstrings?: string[];
  banSubstringsMatchType?: string;
  banSubstringsCaseSensitive?: boolean;
  banSubstringsRedact?: boolean;
  banSubstringsContainsAll?: boolean;

  // Ban topics configuration
  banTopics?: boolean;
  banTopicsThreshold?: number;
  banTopicsTopics?: string[];

  // Code configuration
  code?: boolean;
  codeLanguages?: string[];
  codeIsBlocked?: boolean;

  // Gibberish configuration
  gibberish?: boolean;
  gibberishThreshold?: number;
  gibberishMatchType?: string;

  // Language configuration
  language?: boolean;
  languageValidLanguages?: string[];
  languageMatchType?: string;

  // Prompt injection configuration
  promptInjection?: boolean;
  promptInjectionThreshold?: number;
  promptInjectionMatchType?: string;

  // Regex configuration
  regex?: boolean;
  regexPatterns?: string[];
  regexIsBlocked?: boolean;
  regexRedact?: boolean;

  // Secrets configuration
  secrets?: boolean;
  secretsRedactMode?: string;

  // Sentiment configuration
  sentiment?: boolean;
  sentimentThreshold?: number;
  sentimentMatchType?: string;

  // Token limit configuration
  tokenLimit?: boolean;
  tokenLimitLimit?: number;
  tokenLimitEncodingName?: string;

  // Toxicity configuration
  toxicity?: boolean;
  toxicityThreshold?: number;
  toxicityMatchType?: string;

  tenantId: string;
}) => Promise<Policy | IAppError>;

export type DeletePolicy = (params: {
  id: string;
  tenantId: string;
}) => Promise<{ message: string } | IAppError>;

export type GetPolicy = (params: { id: string; tenantId: string }) => Promise<Policy | IAppError>;

export type ListPolicies = (params: {
  page: number;
  limit: number;
  search?: string;
  field?: string;
  sort?: string;
  defaultDetector?: boolean;
  startDate?: string;
  endDate?: string;
  dateField?: string;
  sortBy?: string;
  tenantId: string;
}) => Promise<
  | {
      docs: Policy[];
      totalCount: number;
      totalPages: number;
      currentPage: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    }
  | IAppError
>;

export type GetPolicyDropdown = (tenantId: string) => Promise<
  | {
      id: string;
      name: string;
      defaultDetector: boolean;
    }[]
  | IAppError
>;

export type GetBuiltInPolicies = (tenantId: string) => Promise<Policy[] | IAppError>;

export type PolicyValidation = {
  createPolicy: ReturnType<typeof import('@/function/validator').default>;
  updatePolicy: ReturnType<typeof import('@/function/validator').default>;
  deletePolicy: ReturnType<typeof import('@/function/validator').default>;
  getPolicy: ReturnType<typeof import('@/function/validator').default>;
  listPolicies: ReturnType<typeof import('@/function/validator').default>;
};
