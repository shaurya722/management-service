import { TenantPrismaClient } from '@/config/prisma';
import validator from '@/function/validator';
import { GetLog, ListLogs, LogValidation } from '@/types/model/log.model';
import { executeWithMigration } from '@/utils/tenantDbOperation';
import { getLogValidation, listLogsValidation } from '@/validation/log.validation';

export const validation: LogValidation = {
  listLogs: validator(listLogsValidation),
  getLog: validator(getLogValidation),
};

export const listLogs: ListLogs = async params => {
  const { tenantId, type } = params;
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);
  const {
    page = 1,
    limit = 10,
    sortBy = type === 'BLUE' ? 'createdAt' : 'timestamp',
    sortOrder,
  } = params;
  if (sortBy === 'createdAt' && type === 'RED') {
    // @ts-expect-error: manual override
    // eslint-disable-next-line no-const-assign
    sortBy = 'timestamp';
  }

  return executeWithMigration(
    tenantId,
    async () => {
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (params.jobId) {
        where.jobId = params.jobId;
      }

      if (params.projectId) {
        where.projectId = params.projectId;
      }

      if (params.status) {
        where.status = params.status;
      }

      if (params.isFail !== undefined) {
        where.isFail = params.isFail;
      }

      if (params.startDate || params.endDate) {
        where.createdAt = {};
        if (params.startDate) {
          where.createdAt.gte = params.startDate;
        }
        if (params.endDate) {
          where.createdAt.lte = params.endDate;
        }
      }

      // Calculate pagination
      // Get total count
      const totalCount =
        type === 'BLUE'
          ? await tenantPrisma.blueTeamLog.count({ where })
          : await tenantPrisma.redTeamLog.count({ where });

      // Get logs
      const logs =
        type === 'BLUE'
          ? await tenantPrisma.blueTeamLog.findMany({
              where,
              skip,
              take: limit,
              orderBy: {
                [sortBy]: sortOrder,
              },
            })
          : await tenantPrisma.redTeamLog.findMany({
              where,
              skip,
              take: limit,
              orderBy: {
                [sortBy]: sortOrder,
              },
            });

      // Calculate pagination info
      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return {
        docs: logs,
        totalCount,
        totalPages,
        currentPage: page,
        hasNextPage,
        hasPreviousPage,
      };
    },
    'list logs',
    ['log'] // Log table
  );
};

export const getLog: GetLog = async params => {
  const { tenantId, type } = params;
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      const log =
        type === 'BLUE'
          ? await tenantPrisma.blueTeamLog.findUnique({
              where: { id: params.id },
            })
          : await tenantPrisma.redTeamLog.findUnique({
              where: { id: params.id },
            });

      if (!log) {
        return null;
      }

      return log;
    },
    'get log',
    ['logs'] // Log table
  );
};
