import { TenantPrismaClient } from '@/config/prisma';
import validator from '@/function/validator';
import {
  CreateProject,
  DeleteProject,
  GetProject,
  GetProjectDropdown,
  ListProjects,
  UpdateProject,
} from '@/types/model/project.model';
import { AppError } from '@/utils/customErrors';
import { executeWithMigration } from '@/utils/tenantDbOperation';
import {
  createProjectValidation,
  deleteProjectValidation,
  getProjectValidation,
  listProjectsValidation,
  ProjectValidation,
  updateProjectValidation,
} from '@/validation/project.validation';

export const validation: ProjectValidation = {
  createProject: validator(createProjectValidation),
  updateProject: validator(updateProjectValidation),
  deleteProject: validator(deleteProjectValidation),
  getProject: validator(getProjectValidation),
  listProjects: validator(listProjectsValidation),
};

export const createProject: CreateProject = async params => {
  const { tenantId } = params;
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      // Check if project name already exists
      const existingProject = await tenantPrisma.project.findUnique({
        where: { name: params.name },
      });

      if (existingProject) {
        return AppError('Project with this name already exists', 409);
      }

      // Validate policy exists if policyId is provided
      if (params.policyId) {
        const existingPolicy = await tenantPrisma.policy.findUnique({
          where: { id: params.policyId },
        });

        if (!existingPolicy) {
          return AppError('Policy not found', 404);
        }
      }

      return await tenantPrisma.project.create({
        data: {
          name: params.name,
          description: params.description || null,
          type: params.type as import('@/generated').Type,
          policyId: params.policyId || null,
          redModelType: params.redModelType
            ? (params.redModelType as import('@/generated').RedModelType)
            : null,
          redModelName: params.redModelName || null,
          redModelUrl: params.redModelUrl || null,
          redModelToken: params.redModelToken || null,
          redAuthorizationType: params.redAuthorizationType
            ? (params.redAuthorizationType as import('@/generated').RedAuthorizationType)
            : null,
          redRequestTemplate: (params.redRequestTemplate as object) || null,
          agenticZipUrl: params.agenticZipUrl || null,
          blueDomain: params.blueDomain || null,
        },
        include: {
          policy: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });
    },
    'create project',
    ['project', 'policy'] // Project operations need project table, policy table, and related enums
  );
};

export const updateProject: UpdateProject = async params => {
  const { tenantId } = params;
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      // Check if project exists
      const existingProject = await tenantPrisma.project.findUnique({
        where: { id: params.id },
      });

      if (!existingProject) {
        return AppError('Project not found', 404);
      }

      // Check if name is being updated and if it conflicts
      if (params.name && params.name !== existingProject.name) {
        const nameConflict = await tenantPrisma.project.findUnique({
          where: { name: params.name },
        });

        if (nameConflict) {
          return AppError('Project with this name already exists', 409);
        }
      }

      // Validate policy exists if policyId is being updated
      if (params.policyId !== undefined && params.policyId !== null) {
        const existingPolicy = await tenantPrisma.policy.findUnique({
          where: { id: params.policyId },
        });

        if (!existingPolicy) {
          return AppError('Policy not found', 404);
        }
      }

      // Build update data object
      const updateData: Record<string, unknown> = {};
      if (params.name !== undefined) updateData.name = params.name;
      if (params.description !== undefined) updateData.description = params.description;
      if (params.type !== undefined) updateData.type = params.type as import('@/generated').Type;
      if (params.policyId !== undefined) updateData.policyId = params.policyId;
      if (params.redModelType !== undefined)
        updateData.redModelType = params.redModelType as import('@/generated').RedModelType;
      if (params.redModelName !== undefined) updateData.redModelName = params.redModelName;
      if (params.redModelUrl !== undefined) updateData.redModelUrl = params.redModelUrl;
      if (params.redModelToken !== undefined) updateData.redModelToken = params.redModelToken;
      if (params.redAuthorizationType !== undefined)
        updateData.redAuthorizationType =
          params.redAuthorizationType as import('@/generated').RedAuthorizationType;
      if (params.redRequestTemplate !== undefined)
        updateData.redRequestTemplate = params.redRequestTemplate;
      if (params.agenticZipUrl !== undefined) updateData.agenticZipUrl = params.agenticZipUrl;
      if (params.blueDomain !== undefined) updateData.blueDomain = params.blueDomain;

      return await tenantPrisma.project.update({
        where: { id: params.id },
        data: updateData,
        include: {
          policy: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
      });
    },
    'update project',
    ['project', 'policy'] // Project operations need project table, policy table, and related enums
  );
};

export const deleteProject: DeleteProject = async params => {
  const { tenantId } = params;
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      // Check if project exists
      const existingProject = await tenantPrisma.project.findUnique({
        where: { id: params.id },
      });

      if (!existingProject) {
        return AppError('Project not found', 404);
      }

      await tenantPrisma.project.delete({
        where: { id: params.id },
      });

      return { message: 'Project deleted successfully' };
    },
    'delete project',
    ['project'] // Project operations need project table and related enums
  );
};

export const getProject: GetProject = async params => {
  const { tenantId } = params;
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      const project = await tenantPrisma.project.findUnique({
        where: { id: params.id },
        include: {
          policy: {
            include: {
              categories: true, // To populate categories
              detectors: true, // To populate detectors
            },
          },
          jobs: {
            select: {
              id: true,
              status: true,
              createdAt: true,
            },
          },
        },
      });

      if (!project) {
        return AppError('Project not found', 404);
      }

      return project;
    },
    'get project',
    ['project', 'policy', 'job'] // Project operations need project table, policy table, job table, and related enums
  );
};

export const listProjects: ListProjects = async params => {
  const { tenantId, page = 1, limit = 10 } = params;
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      const skip = (page - 1) * limit;

      // Build where clause
      const where: Record<string, unknown> = {};

      if (params.search && params.field) {
        where[params.field] = { contains: params.search, mode: 'insensitive' };
      }

      if (params.type) {
        where.type = params.type;
      }

      if (params.startDate && params.endDate && params.dateField) {
        where[params.dateField] = {
          gte: new Date(params.startDate),
          lte: new Date(params.endDate),
        };
      }

      // Build orderBy clause
      const orderBy: Record<string, string> = {};
      if (params.sortBy) {
        orderBy[params.sortBy] = params.sort || 'asc';
      } else {
        orderBy.createdAt = 'desc';
      }

      const [docs, totalDocs] = await Promise.all([
        tenantPrisma.project.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            policy: {
              select: {
                id: true,
                name: true,
                type: true,
              },
            },
          },
        }),
        tenantPrisma.project.count({ where }),
      ]);

      const totalPages = Math.ceil(totalDocs / limit);

      return {
        docs,
        totalCount: totalDocs,
        totalPages,
        currentPage: page,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      };
    },
    'list projects',
    ['project', 'policy', 'job'] // Project operations need project table, policy table, job table, and related enums
  );
};

export const getProjectDropdown: GetProjectDropdown = async params => {
  const { tenantId } = params;
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      const projects = await tenantPrisma.project.findMany({
        select: {
          id: true,
          name: true,
          type: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return projects;
    },
    'get project dropdown',
    ['project'] // Project operations need project table and related enums
  );
};
