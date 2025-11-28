import config from '@/config';
import { TenantPrismaClient } from '@/config/prisma';
import validator from '@/function/validator';
import {
  CreateJob,
  DeleteJob,
  GetJob,
  GetJobDropdown,
  GetJobReport,
  GetJobsByProject,
  GetJobsByStatus,
  ListJobs,
  UpdateJob,
} from '@/types/model/job.model';
import { AppError } from '@/utils/customErrors';
import { encrypt } from '@/utils/security';
import { executeWithMigration } from '@/utils/tenantDbOperation';
import {
  createJobValidation,
  deleteJobValidation,
  getJobReportValidation,
  getJobValidation,
  JobValidation,
  listJobsValidation,
  updateJobValidation,
} from '@/validation/job.validation';

export const validation: JobValidation = {
  createJob: validator(createJobValidation),
  updateJob: validator(updateJobValidation),
  deleteJob: validator(deleteJobValidation),
  getJob: validator(getJobValidation),
  listJobs: validator(listJobsValidation),
  getJobReport: validator(getJobReportValidation),
};

export const createJob: CreateJob = async params => {
  const { tenantId } = params;
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      // Check if project exists
      const existingProject = await tenantPrisma.project.findUnique({
        where: { id: params.projectId },
      });

      if (!existingProject) {
        return AppError('Project not found', 404);
      }

      const job = await tenantPrisma.job.create({
        data: {
          projectId: params.projectId,
          projectType: existingProject.type as import('@/generated').Type,
          status: params.status as import('@/generated').JobStatus,
          redAuthorizationValue: params.redAuthorizationValue || null,
          evaluationThreshold: params.evaluationThreshold || null,
          agenticReport: params.agenticReport || null,
          blueAPIKey: params.blueAPIKey || null,
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });
      if (existingProject.type === 'BLUE') {
        await tenantPrisma.job.update({
          where: { id: job.id },
          data: {
            blueAPIKey: encrypt(`${tenantId}:${job.id}`, config.ENCRYPTION_SECRET),
          },
        });
      }

      return job;
    },
    'create job',
    ['job', 'project'] // Jobs need job table and project table
  );
  // if project type is blue, update job with api key with tenantId:JobID
};

export const updateJob: UpdateJob = async params => {
  const { tenantId } = params;
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      // Check if job exists
      const existingJob = await tenantPrisma.job.findUnique({
        where: { id: params.id },
      });

      if (!existingJob) {
        return AppError('Job not found', 404);
      }

      const updateData: any = {};
      if (params.status !== undefined)
        updateData.status = params.status as import('@/generated').JobStatus;
      if (params.redAuthorizationValue !== undefined)
        updateData.redAuthorizationValue = params.redAuthorizationValue;
      if (params.evaluationThreshold !== undefined)
        updateData.evaluationThreshold = params.evaluationThreshold;
      if (params.agenticReport !== undefined) updateData.agenticReport = params.agenticReport;
      if (params.blueAPIKey !== undefined) updateData.blueAPIKey = params.blueAPIKey;

      const updatedJob = await tenantPrisma.job.update({
        where: { id: params.id },
        data: updateData,
        include: {
          project: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });

      return updatedJob;
    },
    'update job',
    ['job', 'project'] // Jobs need job table and project table
  );
};

export const deleteJob: DeleteJob = async params => {
  const { tenantId } = params;
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      // Check if job exists
      const existingJob = await tenantPrisma.job.findUnique({
        where: { id: params.id },
      });

      if (!existingJob) {
        return AppError('Job not found', 404);
      }
      if (existingJob.projectType === 'RED' && existingJob.status === 'STARTED') {
        return AppError('Cannot delete started job', 400);
      }

      return await tenantPrisma.job.delete({
        where: { id: params.id },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });
    },
    'delete job',
    ['job', 'project'] // Jobs need job table and project table
  );
};

export const getJob: GetJob = async params => {
  const { tenantId } = params;
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      const job = await tenantPrisma.job.findUnique({
        where: { id: params.id },
        include: {
          project: {
            include: {
              policy: {
                include: {
                  categories: {
                    include: {
                      probes: true,
                    },
                  }, // To populate categories
                  detectors: true, // To populate detectors
                },
              },
            },
          },
        },
      });

      if (!job) {
        return AppError('Job not found', 404);
      }

      return job;
    },
    'get job',
    ['job', 'project'] // Jobs need job table and project table
  );
};

export const listJobs: ListJobs = async params => {
  const { tenantId } = params;
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      return await tenantPrisma.$transaction(async tx => {
        const {
          page = 1,
          limit = 10,
          search,
          field,
          sort,
          projectId,
          projectType,
          status,
          startDate,
          endDate,
          dateField,
          sortBy,
        } = params;

        // Build where clause
        const where: Record<string, unknown> = {};

        if (search && field) {
          if (field === 'projectId') {
            where.projectId = { contains: search, mode: 'insensitive' };
          } else if (field === 'status') {
            where.status = { contains: search, mode: 'insensitive' };
          }
        }

        if (projectId) {
          where.projectId = projectId;
        }

        if (projectType) {
          where.projectType = projectType;
        }

        if (status) {
          where.status = status;
        }

        if (startDate && endDate && dateField) {
          const startDateTime = new Date(startDate);
          const endDateTime = new Date(endDate);

          if (dateField === 'createdAt') {
            where.createdAt = { gte: startDateTime, lte: endDateTime };
          } else if (dateField === 'updatedAt') {
            where.updatedAt = { gte: startDateTime, lte: endDateTime };
          }
        }

        // Build orderBy clause
        const orderBy: Record<string, 'asc' | 'desc'> = {};
        if (sortBy && sort) {
          orderBy[sortBy] = sort.toLowerCase() === 'desc' ? 'desc' : 'asc';
        } else {
          orderBy.createdAt = 'desc';
        }

        const totalDocs = await tx.job.count({ where });
        const totalPages = Math.ceil(totalDocs / limit);

        const docs = await tx.job.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy,
          include: {
            project: {
              select: {
                id: true,
                name: true,
                type: true,
                description: true,
              },
            },
          },
        });

        const hasNextPage = page < totalPages;
        const hasPreviousPage = page > 1;
        const currentPage = page;
        const totalCount = totalDocs;

        return { docs, totalCount, totalPages, currentPage, hasNextPage, hasPreviousPage };
      });
    },
    'list jobs',
    ['job', 'project'] // Jobs need job table and project table
  );
};

export const getJobDropdown: GetJobDropdown = async tenantId => {
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      const jobs = await tenantPrisma.job.findMany({
        select: {
          id: true,
          projectId: true,
          status: true,
          projectType: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return jobs;
    },
    'get job dropdown',
    ['job', 'project'] // Jobs need job table and project table
  );
};

export const getJobsByProject: GetJobsByProject = async params => {
  const { tenantId } = params;
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      const jobs = await tenantPrisma.job.findMany({
        where: { projectId: params.projectId },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              type: true,
              description: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return jobs;
    },
    'get jobs by project',
    ['job', 'project'] // Jobs need job table and project table
  );
};

export const getJobsByStatus: GetJobsByStatus = async params => {
  const { tenantId } = params;
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      const jobs = await tenantPrisma.job.findMany({
        where: { status: params.status as import('@/generated').JobStatus },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              type: true,
              description: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return jobs;
    },
    'get jobs by status',
    ['job', 'project'] // Jobs need job table and project table
  );
};

export const getJobReport: GetJobReport = async params => {
  const { jobId, tenantId, month, year } = params;
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      // First, get the job and verify it's a BLUE team job
      const job = await tenantPrisma.job.findUnique({
        where: { id: jobId },
        include: {
          project: {
            select: {
              type: true,
            },
          },
        },
      });

      if (!job) {
        return AppError('Job not found', 404);
      }

      if (job.projectType === 'RED') {
        const redReport = await tenantPrisma.redReport.findMany({
          where: { jobId: jobId },
          orderBy: {
            createdAt: 'desc',
          },
        });

        return redReport;
      }

      // Set up date range for the specified month/year (default to current month)
      const now = new Date();
      const targetYear = year || now.getFullYear();
      const targetMonth = month || now.getMonth() + 1; // getMonth() returns 0-11, we want 1-12

      const startDate = new Date(targetYear, targetMonth - 1, 1); // First day of month
      const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999); // Last day of month

      // Get all logs for this job in the specified month
      const logs = await tenantPrisma.blueTeamLog.findMany({
        where: {
          jobId: jobId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          isFail: true,
          createdAt: true,
          projectId: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      // Calculate totals
      const totalLogs = logs.length;
      const totalFailedLogs = logs.filter(log => log.isFail).length;
      const failedLogPercentage = totalLogs > 0 ? (totalFailedLogs / totalLogs) * 100 : 0;

      // Generate daily data for the month
      const dailyData = new Map<string, { totalLogs: number; failedLogs: number }>();

      // Initialize all days of the month with zero values
      const daysInMonth = new Date(targetYear, targetMonth, 0).getDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${targetYear}-${targetMonth.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        dailyData.set(dateKey, { totalLogs: 0, failedLogs: 0 });
      }

      // Populate with actual data
      logs.forEach(log => {
        const dateKey = log.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD format
        if (dateKey && dailyData.has(dateKey)) {
          const dayData = dailyData.get(dateKey)!;
          dayData.totalLogs++;
          if (log.isFail) {
            dayData.failedLogs++;
          }
        }
      });

      // Convert to arrays for graph data
      const dailyLogsGraph = Array.from(dailyData.entries()).map(([date, data]) => ({
        date,
        totalLogs: data.totalLogs,
      }));

      const dailyFailedPercentageGraph = Array.from(dailyData.entries()).map(([date, data]) => ({
        date,
        failedPercentage: data.totalLogs > 0 ? (data.failedLogs / data.totalLogs) * 100 : 0,
      }));

      // Calculate project breakdown
      const projectStats = new Map<
        string,
        { totalLogs: number; failedLogs: number; projectName?: string }
      >();

      // Group logs by projectId
      logs.forEach(log => {
        if (log.projectId) {
          const existing = projectStats.get(log.projectId) || { totalLogs: 0, failedLogs: 0 };
          existing.totalLogs++;
          if (log.isFail) {
            existing.failedLogs++;
          }
          projectStats.set(log.projectId, existing);
        }
      });

      // Get project names for all projects that have logs
      const projectIds = Array.from(projectStats.keys());
      const projects = await tenantPrisma.project.findMany({
        where: {
          id: { in: projectIds },
        },
        select: {
          id: true,
          name: true,
        },
      });

      // Create project breakdown with names
      const projectBreakdown = projects.map(project => {
        const stats = projectStats.get(project.id)!;
        const projectFailedPercentage =
          stats.totalLogs > 0 ? (stats.failedLogs / stats.totalLogs) * 100 : 0;

        return {
          projectId: project.id,
          projectName: project.name,
          totalLogs: stats.totalLogs,
          totalFailedLogs: stats.failedLogs,
          failedLogPercentage: Math.round(projectFailedPercentage * 100) / 100, // Round to 2 decimal places
        };
      });

      return {
        totalLogs,
        totalFailedLogs,
        failedLogPercentage: Math.round(failedLogPercentage * 100) / 100, // Round to 2 decimal places
        projectBreakdown,
        dailyLogsGraph,
        dailyFailedPercentageGraph,
      };
    },
    'get job report',
    ['job', 'project', 'blueteam_logs'] // Need job, project, and blueteam_logs tables
  );
};

export const checkRabbitMQHealth = async (): Promise<boolean> => {
  try {
    const amqp = await import('amqplib');
    const connection = await amqp.connect(config.RABBITMQ_URL);
    await connection.close();
    return true;
  } catch (error) {
    console.error('RabbitMQ health check failed:', error);
    return false;
  }
};
