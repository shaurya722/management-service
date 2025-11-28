import { TenantPrismaClient } from '@/config/prisma';
import validator from '@/function/validator';
import {
  CreateProbe,
  DeleteProbe,
  GetBuiltInProbes,
  GetProbe,
  GetProbeDropdown,
  ListProbes,
  UpdateProbe,
} from '@/types/model/probe.model';
import { AppError } from '@/utils/customErrors';
import { executeTransactionWithMigration, executeWithMigration } from '@/utils/tenantDbOperation';
import {
  createProbeValidation,
  deleteProbeValidation,
  getProbeValidation,
  listProbesValidation,
  ProbeValidation,
  updateProbeValidation,
} from '@/validation/probe.validation';

export const validation: ProbeValidation = {
  createProbe: validator(createProbeValidation),
  updateProbe: validator(updateProbeValidation),
  deleteProbe: validator(deleteProbeValidation),
  getProbe: validator(getProbeValidation),
  listProbes: validator(listProbesValidation),
};

export const createProbe: CreateProbe = async params => {
  const { tenantId } = params;
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      // Check if probe ID already exists
      const existingProbe = await tenantPrisma.probe.findUnique({
        where: { probeId: params.probeId },
      });

      if (existingProbe) {
        return AppError('Probe with this ID already exists', 409);
      }

      return await tenantPrisma.probe.create({
        data: {
          probeId: params.probeId,
          name: params.name,
          description: params.description || null,
        },
      });
    },
    'create probe',
    ['probe'] // Probe operations need probe table
  );
};

export const updateProbe: UpdateProbe = async params => {
  const { tenantId } = params;
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      // Check if probe exists
      const existingProbe = await tenantPrisma.probe.findUnique({
        where: { id: params.id },
      });

      if (!existingProbe) {
        return AppError('Probe not found', 404);
      }

      // If updating probe ID, check for uniqueness
      if (params.probeId && params.probeId !== existingProbe.probeId) {
        const probeIdExists = await tenantPrisma.probe.findUnique({
          where: { probeId: params.probeId },
        });

        if (probeIdExists) {
          return AppError('Probe with this ID already exists', 409);
        }
      }

      const updateData: Partial<import('@/generated').Probe> = {};
      if (params.probeId !== undefined) updateData.probeId = params.probeId;
      if (params.name !== undefined) updateData.name = params.name;
      if (params.description !== undefined) updateData.description = params.description;

      return await tenantPrisma.probe.update({
        where: { id: params.id },
        data: updateData,
      });
    },
    'update probe',
    ['probe'] // Probe operations need probe table
  );
};

export const deleteProbe: DeleteProbe = async params => {
  const { tenantId } = params;
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      // Check if probe exists
      const existingProbe = await tenantPrisma.probe.findUnique({
        where: { id: params.id },
      });

      if (!existingProbe) {
        return AppError('Probe not found', 404);
      }

      return await tenantPrisma.probe.delete({
        where: { id: params.id },
      });
    },
    'delete probe',
    ['probe'] // Probe operations need probe table
  );
};

export const getProbe: GetProbe = async params => {
  const { tenantId } = params;
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      const probe = await tenantPrisma.probe.findUnique({
        where: { id: params.id },
      });

      if (!probe) {
        return AppError('Probe not found', 404);
      }

      return probe;
    },
    'get probe',
    ['probe'] // Probe operations need probe table
  );
};

export const listProbes: ListProbes = async params => {
  const { tenantId } = params;
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeTransactionWithMigration(
    tenantId,
    async () => {
      return await tenantPrisma.$transaction(async tx => {
        const {
          page = 1,
          limit = 10,
          search,
          field,
          sort,
          startDate,
          endDate,
          dateField,
          sortBy,
        } = params;

        // Build where clause
        const where: Record<string, unknown> = {};

        if (search && field) {
          if (field === 'name') {
            where.name = { contains: search, mode: 'insensitive' };
          } else if (field === 'description') {
            where.description = { contains: search, mode: 'insensitive' };
          } else if (field === 'probeId') {
            where.probeId = { contains: search, mode: 'insensitive' };
          }
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

        const totalDocs = await tx.probe.count({ where });
        const totalPages = Math.ceil(totalDocs / limit);

        const docs = await tx.probe.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy,
        });

        const hasNextPage = page < totalPages;
        const hasPreviousPage = page > 1;
        const currentPage = page;
        const totalCount = totalDocs;

        return { docs, totalCount, totalPages, currentPage, hasNextPage, hasPreviousPage };
      });
    },
    'list probes',
    ['probe'] // Probe operations need probe table
  );
};

export const getProbeDropdown: GetProbeDropdown = async tenantId => {
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      const probes = await tenantPrisma.probe.findMany({
        select: {
          id: true,
          probeId: true,
          name: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return probes;
    },
    'get probe dropdown',
    ['probe'] // Probe operations need probe table
  );
};

export const getBuiltInProbes: GetBuiltInProbes = async tenantId => {
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      const probes = await tenantPrisma.probe.findMany({
        orderBy: {
          name: 'asc',
        },
      });

      return probes;
    },
    'get built-in probes',
    ['probe'] // Probe operations need probe table
  );
};
