import { TenantPrismaClient } from '@/config/prisma';
import validator from '@/function/validator';
import type { Prisma } from '@/generated';
import {
  CreatePolicy,
  DeletePolicy,
  GetBuiltInPolicies,
  GetPolicy,
  GetPolicyDropdown,
  ListPolicies,
  UpdatePolicy,
} from '@/types/model/policy.model';
import { AppError } from '@/utils/customErrors';
import { executeTransactionWithMigration, executeWithMigration } from '@/utils/tenantDbOperation';
import {
  PolicyValidation,
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

export const createPolicy: CreatePolicy = async params => {
  const { tenantId } = params;
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      // Check if policy name already exists
      const existingPolicy = await tenantPrisma.policy.findFirst({
        where: { name: params.name },
      });

      if (existingPolicy) {
        return AppError('Policy with this name already exists', 409);
      }

      // Create policy with relations using Prisma's built-in relation handling
      try {
        // First, validate that all detector and category IDs exist
        if (params.detectorIds && params.detectorIds.length > 0) {
          const existingDetectors = await tenantPrisma.detectors.findMany({
            where: { id: { in: params.detectorIds } },
            select: { id: true },
          });
          const foundIds = existingDetectors.map(d => d.id);
          const missingIds = params.detectorIds.filter(id => !foundIds.includes(id));
          if (missingIds.length > 0) {
            console.error('Missing detector IDs:', missingIds);
            return AppError(`Detector IDs not found: ${missingIds.join(', ')}`, 400);
          }
        }

        if (params.categoryIds && params.categoryIds.length > 0) {
          const existingCategories = await tenantPrisma.category.findMany({
            where: { id: { in: params.categoryIds } },
            select: { id: true },
          });
          const foundIds = existingCategories.map(c => c.id);
          const missingIds = params.categoryIds.filter(id => !foundIds.includes(id));
          if (missingIds.length > 0) {
            console.error('Missing category IDs:', missingIds);
            return AppError(`Category IDs not found: ${missingIds.join(', ')}`, 400);
          }
        }

        return await tenantPrisma.policy.create({
          data: {
            name: params.name,
            description: params.description || null,
            type: params.type,
            defaultDetector: params.defaultDetector ?? true,

            // Anonymize configuration
            anonymize: params.anonymize ?? false,
            anonymizeType: params.anonymizeType ?? [],
            anonymizeHiddenNames: params.anonymizeHiddenNames ?? [],
            anonymizeAllowedNames: params.anonymizeAllowedNames ?? [],
            anonymizePreamble: params.anonymizePreamble || null,
            anonymizeUseFaker: params.anonymizeUseFaker ?? false,
            anonymizeThreshold: params.anonymizeThreshold || null,

            // Ban code configuration
            banCode: params.banCode ?? false,
            banCodeThreshold: params.banCodeThreshold || null,

            // Ban competitors configuration
            banCompetitors: params.banCompetitors ?? false,
            banCompetitorsThreshold: params.banCompetitorsThreshold || null,
            banCompetitorsCompetitors: params.banCompetitorsCompetitors ?? [],

            // Ban substrings configuration
            banSubstrings: params.banSubstrings ?? false,
            banSubstringsSubstrings: params.banSubstringsSubstrings ?? [],
            banSubstringsMatchType: params.banSubstringsMatchType || null,
            banSubstringsCaseSensitive: params.banSubstringsCaseSensitive ?? false,
            banSubstringsRedact: params.banSubstringsRedact ?? false,
            banSubstringsContainsAll: params.banSubstringsContainsAll ?? false,

            // Ban topics configuration
            banTopics: params.banTopics ?? false,
            banTopicsThreshold: params.banTopicsThreshold || null,
            banTopicsTopics: params.banTopicsTopics ?? [],

            // Code configuration
            code: params.code ?? false,
            codeLanguages: params.codeLanguages ?? [],
            codeIsBlocked: params.codeIsBlocked ?? false,

            // Gibberish configuration
            gibberish: params.gibberish ?? false,
            gibberishThreshold: params.gibberishThreshold || null,
            gibberishMatchType: params.gibberishMatchType || null,

            // Language configuration
            language: params.language ?? false,
            languageValidLanguages: params.languageValidLanguages ?? [],
            languageMatchType: params.languageMatchType || null,

            // Prompt injection configuration
            promptInjection: params.promptInjection ?? false,
            promptInjectionThreshold: params.promptInjectionThreshold || null,
            promptInjectionMatchType: params.promptInjectionMatchType || null,

            // Regex configuration
            regex: params.regex ?? false,
            regexPatterns: params.regexPatterns ?? [],
            regexIsBlocked: params.regexIsBlocked ?? false,
            regexRedact: params.regexRedact ?? false,

            // Secrets configuration
            secrets: params.secrets ?? false,
            secretsRedactMode: params.secretsRedactMode || null,

            // Sentiment configuration
            sentiment: params.sentiment ?? false,
            sentimentThreshold: params.sentimentThreshold || null,
            sentimentMatchType: params.sentimentMatchType || null,

            // Token limit configuration
            tokenLimit: params.tokenLimit ?? false,
            tokenLimitLimit: params.tokenLimitLimit || null,
            tokenLimitEncodingName: params.tokenLimitEncodingName || null,

            // Toxicity configuration
            toxicity: params.toxicity ?? false,
            toxicityThreshold: params.toxicityThreshold || null,
            toxicityMatchType: params.toxicityMatchType || null,

            // Connect detectors if provided
            ...(params.detectorIds &&
              params.detectorIds.length > 0 && {
                detectors: {
                  connect: params.detectorIds.map(id => ({ id })),
                },
              }),
            // Connect categories if provided
            ...(params.categoryIds &&
              params.categoryIds.length > 0 && {
                categories: {
                  connect: params.categoryIds.map(id => ({ id })),
                },
              }),
          },
        });
      } catch (relationError) {
        console.error('Error creating policy with relations:', relationError);
        throw relationError;
      }
    },
    'create policy',
    ['policy', 'detector', 'category'] // Policy operations need policy, detector, and category tables
  );
};

export const updatePolicy: UpdatePolicy = async params => {
  const { tenantId, id } = params;
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeTransactionWithMigration(
    tenantId,
    async () => {
      // Check if policy exists
      const existingPolicy = await tenantPrisma.policy.findUnique({
        where: { id },
      });

      if (!existingPolicy) {
        return AppError('Policy not found', 404);
      }

      // Check if name is being updated and if it conflicts with another policy
      if (params.name && params.name !== existingPolicy.name) {
        const nameConflict = await tenantPrisma.policy.findFirst({
          where: { name: params.name },
        });

        if (nameConflict) {
          return AppError('Policy with this name already exists', 409);
        }
      }

      return await tenantPrisma.$transaction(async tx => {
        // Update policy basic fields
        const updateData: Prisma.PolicyUpdateInput = {};
        if (params.name !== undefined) updateData.name = params.name;
        if (params.description !== undefined) updateData.description = params.description;
        if (params.type !== undefined) updateData.type = params.type;
        if (params.defaultDetector !== undefined)
          updateData.defaultDetector = params.defaultDetector;

        // Anonymize configuration
        if (params.anonymize !== undefined) updateData.anonymize = params.anonymize;
        if (params.anonymizeType !== undefined) updateData.anonymizeType = params.anonymizeType;
        if (params.anonymizeHiddenNames !== undefined)
          updateData.anonymizeHiddenNames = params.anonymizeHiddenNames;
        if (params.anonymizeAllowedNames !== undefined)
          updateData.anonymizeAllowedNames = params.anonymizeAllowedNames;
        if (params.anonymizePreamble !== undefined)
          updateData.anonymizePreamble = params.anonymizePreamble;
        if (params.anonymizeUseFaker !== undefined)
          updateData.anonymizeUseFaker = params.anonymizeUseFaker;
        if (params.anonymizeThreshold !== undefined)
          updateData.anonymizeThreshold = params.anonymizeThreshold;

        // Ban code configuration
        if (params.banCode !== undefined) updateData.banCode = params.banCode;
        if (params.banCodeThreshold !== undefined)
          updateData.banCodeThreshold = params.banCodeThreshold;

        // Ban competitors configuration
        if (params.banCompetitors !== undefined) updateData.banCompetitors = params.banCompetitors;
        if (params.banCompetitorsThreshold !== undefined)
          updateData.banCompetitorsThreshold = params.banCompetitorsThreshold;
        if (params.banCompetitorsCompetitors !== undefined)
          updateData.banCompetitorsCompetitors = params.banCompetitorsCompetitors;

        // Ban substrings configuration
        if (params.banSubstrings !== undefined) updateData.banSubstrings = params.banSubstrings;
        if (params.banSubstringsSubstrings !== undefined)
          updateData.banSubstringsSubstrings = params.banSubstringsSubstrings;
        if (params.banSubstringsMatchType !== undefined)
          updateData.banSubstringsMatchType = params.banSubstringsMatchType;
        if (params.banSubstringsCaseSensitive !== undefined)
          updateData.banSubstringsCaseSensitive = params.banSubstringsCaseSensitive;
        if (params.banSubstringsRedact !== undefined)
          updateData.banSubstringsRedact = params.banSubstringsRedact;
        if (params.banSubstringsContainsAll !== undefined)
          updateData.banSubstringsContainsAll = params.banSubstringsContainsAll;

        // Ban topics configuration
        if (params.banTopics !== undefined) updateData.banTopics = params.banTopics;
        if (params.banTopicsThreshold !== undefined)
          updateData.banTopicsThreshold = params.banTopicsThreshold;
        if (params.banTopicsTopics !== undefined)
          updateData.banTopicsTopics = params.banTopicsTopics;

        // Code configuration
        if (params.code !== undefined) updateData.code = params.code;
        if (params.codeLanguages !== undefined) updateData.codeLanguages = params.codeLanguages;
        if (params.codeIsBlocked !== undefined) updateData.codeIsBlocked = params.codeIsBlocked;

        // Gibberish configuration
        if (params.gibberish !== undefined) updateData.gibberish = params.gibberish;
        if (params.gibberishThreshold !== undefined)
          updateData.gibberishThreshold = params.gibberishThreshold;
        if (params.gibberishMatchType !== undefined)
          updateData.gibberishMatchType = params.gibberishMatchType;

        // Language configuration
        if (params.language !== undefined) updateData.language = params.language;
        if (params.languageValidLanguages !== undefined)
          updateData.languageValidLanguages = params.languageValidLanguages;
        if (params.languageMatchType !== undefined)
          updateData.languageMatchType = params.languageMatchType;

        // Prompt injection configuration
        if (params.promptInjection !== undefined)
          updateData.promptInjection = params.promptInjection;
        if (params.promptInjectionThreshold !== undefined)
          updateData.promptInjectionThreshold = params.promptInjectionThreshold;
        if (params.promptInjectionMatchType !== undefined)
          updateData.promptInjectionMatchType = params.promptInjectionMatchType;

        // Regex configuration
        if (params.regex !== undefined) updateData.regex = params.regex;
        if (params.regexPatterns !== undefined) updateData.regexPatterns = params.regexPatterns;
        if (params.regexIsBlocked !== undefined) updateData.regexIsBlocked = params.regexIsBlocked;
        if (params.regexRedact !== undefined) updateData.regexRedact = params.regexRedact;

        // Secrets configuration
        if (params.secrets !== undefined) updateData.secrets = params.secrets;
        if (params.secretsRedactMode !== undefined)
          updateData.secretsRedactMode = params.secretsRedactMode;

        // Sentiment configuration
        if (params.sentiment !== undefined) updateData.sentiment = params.sentiment;
        if (params.sentimentThreshold !== undefined)
          updateData.sentimentThreshold = params.sentimentThreshold;
        if (params.sentimentMatchType !== undefined)
          updateData.sentimentMatchType = params.sentimentMatchType;

        // Token limit configuration
        if (params.tokenLimit !== undefined) updateData.tokenLimit = params.tokenLimit;
        if (params.tokenLimitLimit !== undefined)
          updateData.tokenLimitLimit = params.tokenLimitLimit;
        if (params.tokenLimitEncodingName !== undefined)
          updateData.tokenLimitEncodingName = params.tokenLimitEncodingName;

        // Toxicity configuration
        if (params.toxicity !== undefined) updateData.toxicity = params.toxicity;
        if (params.toxicityThreshold !== undefined)
          updateData.toxicityThreshold = params.toxicityThreshold;
        if (params.toxicityMatchType !== undefined)
          updateData.toxicityMatchType = params.toxicityMatchType;

        const policy = await tx.policy.update({
          where: { id },
          data: updateData,
        });

        // Update detector relations if provided
        if (params.detectorIds) {
          await tx.policy.update({
            where: { id },
            data: {
              detectors: {
                set: params.detectorIds.map(detectorId => ({ id: detectorId })),
              },
            },
          });
        }

        // Update category relations if provided
        if (params.categoryIds) {
          await tx.policy.update({
            where: { id },
            data: {
              categories: {
                set: params.categoryIds.map(categoryId => ({ id: categoryId })),
              },
            },
          });
        }

        return policy;
      });
    },
    'update policy',
    ['policy', 'detector', 'category'] // Policy operations need policy, detector, and category tables
  );
};

export const deletePolicy: DeletePolicy = async params => {
  const { tenantId, id } = params;
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      // Check if policy exists
      const existingPolicy = await tenantPrisma.policy.findUnique({
        where: { id },
      });

      if (!existingPolicy) {
        return AppError('Policy not found', 404);
      }

      // Delete policy (relations will be automatically handled by Prisma)
      await tenantPrisma.policy.delete({
        where: { id },
      });

      return { message: 'Policy deleted successfully' };
    },
    'delete policy',
    ['policy', 'detector', 'category'] // Policy operations need policy, detector, and category tables
  );
};

export const getPolicy: GetPolicy = async params => {
  const { tenantId, id } = params;
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      // Try to get policy with relations first
      let policy;
      try {
        // populate category data and detector data
        policy = await tenantPrisma.policy.findUnique({
          where: { id },
          include: {
            detectors: {
              select: {
                id: true,
                detectorName: true,
                description: true,
                detectorType: true,
                creationType: true,
                confidence: true,
              },
            },
            categories: {
              select: {
                id: true,
                name: true,
                description: true,
                probes: {
                  select: {
                    probeId: true,
                    probe: {
                      select: {
                        name: true,
                        description: true,
                        probeId: true,
                        createdAt: true,
                        updatedAt: true,
                      },
                    },
                  },
                },
              },
            },
          },
        });
      } catch (_relationError) {
        // If junction tables don't exist, get policy without relations
        policy = await tenantPrisma.policy.findUnique({
          where: { id },
        });
        if (policy) {
          // Add empty arrays for relations
          (policy as Record<string, unknown>).detectors = [];
          (policy as Record<string, unknown>).categories = [];
        }
      }

      if (!policy) {
        return AppError('Policy not found', 404);
      }

      return policy;
    },
    'get policy',
    ['policy', 'detector', 'category'] // Policy operations need policy, detector, and category tables
  );
};

export const listPolicies: ListPolicies = async params => {
  const {
    tenantId,
    page,
    limit,
    search,
    field,
    sort,
    defaultDetector,
    startDate,
    endDate,
    dateField,
    sortBy,
  } = params;
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      const skip = (page - 1) * limit;
      const where: Prisma.PolicyWhereInput = {};

      // Search functionality
      if (search && field) {
        if (field === 'name') {
          where.name = { contains: search, mode: 'insensitive' };
        } else if (field === 'description') {
          where.description = { contains: search, mode: 'insensitive' };
        }
      }

      // Default detector filter
      if (defaultDetector !== undefined) {
        where.defaultDetector = defaultDetector;
      }

      // Date range filter
      if (startDate && endDate && dateField) {
        const startDateTime = new Date(startDate);
        const endDateTime = new Date(endDate);

        if (dateField === 'createdAt') {
          where.createdAt = { gte: startDateTime, lte: endDateTime };
        } else if (dateField === 'updatedAt') {
          where.updatedAt = { gte: startDateTime, lte: endDateTime };
        }
      }

      // Sorting
      const orderBy: Prisma.PolicyOrderByWithRelationInput = {};
      if (sortBy && sort) {
        if (sortBy === 'name') {
          orderBy.name = sort.toLowerCase() as Prisma.SortOrder;
        } else if (sortBy === 'createdAt') {
          orderBy.createdAt = sort.toLowerCase() as Prisma.SortOrder;
        } else if (sortBy === 'updatedAt') {
          orderBy.updatedAt = sort.toLowerCase() as Prisma.SortOrder;
        }
      } else {
        orderBy.createdAt = 'desc';
      }

      const totalCount = await tenantPrisma.policy.count({ where });
      const policies = await tenantPrisma.policy.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          detectors: {
            select: {
              id: true,
              detectorName: true,
              description: true,
              detectorType: true,
              creationType: true,
              confidence: true,
            },
          },
          categories: {
            select: {
              id: true,
              name: true,
              description: true,
              probes: {
                select: {
                  probeId: true,
                  probe: {
                    select: {
                      name: true,
                      description: true,
                      probeId: true,
                      createdAt: true,
                      updatedAt: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return {
        docs: policies,
        totalCount,
        totalPages,
        currentPage: page,
        hasNextPage,
        hasPreviousPage,
      };
    },
    'list policies',
    ['policy', 'detector', 'category'] // Policy operations need policy, detector, and category tables
  );
};

export const getPolicyDropdown: GetPolicyDropdown = async tenantId => {
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      const policies = await tenantPrisma.policy.findMany({
        select: {
          id: true,
          name: true,
          defaultDetector: true,
          type: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return policies;
    },
    'get policy dropdown',
    ['policy', 'detector', 'category'] // Policy operations need policy, detector, and category tables
  );
};

export const getBuiltInPolicies: GetBuiltInPolicies = async tenantId => {
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      const policies = await tenantPrisma.policy.findMany({
        orderBy: {
          name: 'asc',
        },
      });

      return policies;
    },
    'get built-in policies',
    ['policy', 'detector', 'category'] // Policy operations need policy, detector, and category tables
  );
};
