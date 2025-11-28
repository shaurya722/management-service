import { TenantPrismaClient } from '@/config/prisma';
import validator from '@/function/validator';
import {
  CreateDetector,
  DeleteDetector,
  GetBuiltInDetectors,
  GetDetector,
  GetDetectorDropdown,
  ListDetectors,
  UpdateDetector,
} from '@/types/model/detector.model';
import { AppError } from '@/utils/customErrors';
import { executeWithMigration } from '@/utils/tenantDbOperation';
import {
  createDetectorValidation,
  deleteDetectorValidation,
  DetectorValidation,
  getDetectorValidation,
  listDetectorsValidation,
  updateDetectorValidation,
} from '@/validation/detector.validation';

export const validation: DetectorValidation = {
  createDetector: validator(createDetectorValidation),
  updateDetector: validator(updateDetectorValidation),
  deleteDetector: validator(deleteDetectorValidation),
  getDetector: validator(getDetectorValidation),
  listDetectors: validator(listDetectorsValidation),
};

export const createDetector: CreateDetector = async params => {
  const { tenantId } = params;
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  try {
    // Check if detector name already exists
    const existingDetector = await tenantPrisma.detectors.findUnique({
      where: { detectorName: params.detectorName },
    });

    if (existingDetector) {
      return AppError('Detector with this name already exists', 409);
    }

    return await tenantPrisma.detectors.create({
      data: {
        detectorName: params.detectorName,
        description: params.description || null,
        creationType: 'External', // User-created detectors are External
        detectorType: params.detectorType as import('@/generated').DetectorType,
        confidence: params.confidence,
        regex: params.regex || [],
      },
    });
  } catch (error) {
    console.error('Error creating detector:', error);

    // Check if error is related to missing enum types
    if (error instanceof Error && error.message.includes('does not exist')) {
      try {
        // Attempt to migrate the tenant schema
        await TenantPrismaClient.migrateTenantSchema(tenantId);

        // Retry the operation after migration
        return await tenantPrisma.detectors.create({
          data: {
            detectorName: params.detectorName,
            description: params.description || null,
            creationType: 'External',
            detectorType: params.detectorType as import('@/generated').DetectorType,
            confidence: params.confidence,
            regex: params.regex || [],
          },
        });
      } catch (migrationError) {
        console.error('Error during schema migration:', migrationError);
        return AppError('Failed to create detector after schema migration', 500);
      }
    }

    return AppError('Failed to create detector', 500);
  }
};

export const updateDetector: UpdateDetector = async params => {
  const { tenantId } = params;
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      // Check if detector exists
      const existingDetector = await tenantPrisma.detectors.findUnique({
        where: { id: params.id },
      });

      if (!existingDetector) {
        return AppError('Detector not found', 404);
      }

      // Check if it's a built-in detector (cannot be modified)
      if (existingDetector.creationType === 'BuiltIn') {
        return AppError('Built-in detectors cannot be modified', 403);
      }

      // If updating detector name, check for uniqueness
      if (params.detectorName && params.detectorName !== existingDetector.detectorName) {
        const nameExists = await tenantPrisma.detectors.findUnique({
          where: { detectorName: params.detectorName },
        });

        if (nameExists) {
          return AppError('Detector with this name already exists', 409);
        }
      }

      const updateData: Partial<import('@/generated').Detectors> = {};
      if (params.detectorName !== undefined) updateData.detectorName = params.detectorName;
      if (params.description !== undefined) updateData.description = params.description;
      if (params.detectorType !== undefined)
        updateData.detectorType = params.detectorType as import('@/generated').DetectorType;
      if (params.confidence !== undefined) updateData.confidence = params.confidence;
      if (params.regex) updateData.regex = params.regex;

      return await tenantPrisma.detectors.update({
        where: { id: params.id },
        data: updateData,
      });
    },
    'update detector',
    ['detector'] // Detectors need detector table and related enums
  );
};

export const deleteDetector: DeleteDetector = async params => {
  const { tenantId } = params;
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      // Check if detector exists
      const existingDetector = await tenantPrisma.detectors.findUnique({
        where: { id: params.id },
      });

      if (!existingDetector) {
        return AppError('Detector not found', 404);
      }

      // Check if it's a built-in detector (cannot be deleted)
      if (existingDetector.creationType === 'BuiltIn') {
        return AppError('Built-in detectors cannot be deleted', 403);
      }

      return await tenantPrisma.detectors.delete({
        where: { id: params.id },
      });
    },
    'delete detector',
    ['detector'] // Detectors need detector table and related enums
  );
};

export const getDetector: GetDetector = async params => {
  const { tenantId } = params;
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      const detector = await tenantPrisma.detectors.findUnique({
        where: { id: params.id },
      });

      if (!detector) {
        return AppError('Detector not found', 404);
      }

      return detector;
    },
    'get detector',
    ['detector'] // Detectors need detector table and related enums
  );
};

export const listDetectors: ListDetectors = async params => {
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
          creationType,
          detectorType,
          startDate,
          endDate,
          dateField,
          sortBy,
        } = params;

        // Build where clause
        const where: Record<string, unknown> = {};

        if (search && field) {
          if (field === 'detectorName') {
            where.detectorName = { contains: search, mode: 'insensitive' };
          } else if (field === 'description') {
            where.description = { contains: search, mode: 'insensitive' };
          }
        }

        if (creationType) {
          where.creationType = creationType;
        }

        if (detectorType) {
          where.detectorType = detectorType;
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

        const totalDocs = await tx.detectors.count({ where });
        const totalPages = Math.ceil(totalDocs / limit);

        const docs = await tx.detectors.findMany({
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
    'list detectors',
    ['detector'] // Detectors need detector table and related enums
  );
};

export const getDetectorDropdown: GetDetectorDropdown = async tenantId => {
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      const detectors = await tenantPrisma.detectors.findMany({
        select: {
          id: true,
          detectorName: true,
          detectorType: true,
          creationType: true,
        },
        orderBy: {
          detectorName: 'asc',
        },
      });

      return detectors;
    },
    'get detector dropdown',
    ['detector'] // Detectors need detector table and related enums
  );
};

export const getBuiltInDetectors: GetBuiltInDetectors = async tenantId => {
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      const detectors = await tenantPrisma.detectors.findMany({
        where: { creationType: 'BuiltIn' },
      });

      return detectors;
    },
    'get built-in detectors',
    ['detector'] // Detectors need detector table and related enums
  );
};
