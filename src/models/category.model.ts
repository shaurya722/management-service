import { TenantPrismaClient } from '@/config/prisma';
import type { Prisma } from '../generated/index';
import {
  CreateCategory,
  DeleteCategory,
  GetBuiltInCategories,
  GetCategory,
  GetCategoryDropdown,
  ListCategories,
  UpdateCategory,
} from '@/types/model/category.model';
import { AppError } from '@/utils/customErrors';
import { executeWithMigration } from '@/utils/tenantDbOperation';

export const createCategory: CreateCategory = async params => {
  const { tenantId } = params;
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      // Check if category name already exists
      const existingCategory = await tenantPrisma.category.findFirst({
        where: { name: params.name },
      });

      if (existingCategory) {
        return AppError('Category with this name already exists', 409);
      }

      const categoryData: Prisma.CategoryCreateInput = {
        name: params.name,
        description: params.description || null,
      };

      // Add probes connection if provided
      if (params.probes && params.probes.length > 0) {
        categoryData.probes = {
          create: params.probes.map(probeId => ({
            probeId: probeId,
          })),
        };
      }

      return await tenantPrisma.category.create({
        data: categoryData,
        include: {
          probes: {
            include: {
              probe: true,
            },
          },
        },
      });
    },
    'create category',
    ['category', 'probe'] // Categories need category table and probe relationships
  );
};

export const updateCategory: UpdateCategory = async params => {
  const { tenantId, id } = params;
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      // Check if category exists
      const existingCategory = await tenantPrisma.category.findUnique({
        where: { id },
      });

      if (!existingCategory) {
        return AppError('Category not found', 404);
      }

      // Check if name is being updated and if it conflicts with another category
      if (params.name && params.name !== existingCategory.name) {
        const nameConflict = await tenantPrisma.category.findFirst({
          where: { name: params.name },
        });

        if (nameConflict) {
          return AppError('Category with this name already exists', 409);
        }
      }

      const updateData: Prisma.CategoryUpdateInput = {};
      if (params.name !== undefined) updateData.name = params.name;
      if (params.description !== undefined) updateData.description = params.description;

      // Handle probes update - replace all existing connections
      if (params.probes !== undefined) {
        updateData.probes = {
          deleteMany: {}, // Remove all existing connections
          create: params.probes.map(probeId => ({
            probeId: probeId,
          })),
        };
      }

      return await tenantPrisma.category.update({
        where: { id },
        data: updateData,
        include: {
          probes: {
            include: {
              probe: true,
            },
          },
        },
      });
    },
    'update category',
    ['category', 'probe'] // Categories need category table and probe relationships
  );
};

export const deleteCategory: DeleteCategory = async params => {
  const { tenantId, id } = params;
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      // Check if category exists
      const existingCategory = await tenantPrisma.category.findUnique({
        where: { id },
      });

      if (!existingCategory) {
        return AppError('Category not found', 404);
      }

      await tenantPrisma.category.delete({
        where: { id },
      });

      return { message: 'Category deleted successfully' };
    },
    'delete category',
    ['category', 'probe'] // Categories need category table and probe relationships
  );
};

export const getCategory: GetCategory = async params => {
  const { tenantId, id } = params;
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      const category = await tenantPrisma.category.findUnique({
        where: { id },
        include: {
          probes: {
            include: {
              probe: true,
            },
          },
        },
      });

      if (!category) {
        return AppError('Category not found', 404);
      }

      return category;
    },
    'get category',
    ['category', 'probe'] // Categories need category table and probe relationships
  );
};

export const listCategories: ListCategories = async params => {
  const { tenantId, page, limit, search, field, sort, startDate, endDate, dateField, sortBy } =
    params;
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      const skip = (page - 1) * limit;
      const where: Prisma.CategoryWhereInput = {};

      // Search functionality
      if (search && field) {
        if (field === 'name') {
          where.name = { contains: search, mode: 'insensitive' };
        } else if (field === 'description') {
          where.description = { contains: search, mode: 'insensitive' };
        }
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
      const orderBy: Prisma.CategoryOrderByWithRelationInput = {};
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

      const totalCount = await tenantPrisma.category.count({ where });
      let categories;

      try {
        // Try to get categories with probes relation first
        categories = await tenantPrisma.category.findMany({
          include: {
            probes: {
              include: {
                probe: true,
              },
            },
          },
          where,
          skip,
          take: limit,
          orderBy,
        });
      } catch (_relationError) {
        // If junction table doesn't exist, get categories without probes relation
        categories = await tenantPrisma.category.findMany({
          where,
          skip,
          take: limit,
          orderBy,
        });
      }

      const totalPages = Math.ceil(totalCount / limit);
      const hasNextPage = page < totalPages;
      const hasPreviousPage = page > 1;

      return {
        docs: categories,
        totalCount,
        totalPages,
        currentPage: page,
        hasNextPage,
        hasPreviousPage,
      };
    },
    'list categories',
    ['category', 'probe'] // Categories need category table and probe relationships
  );
};

export const getCategoryDropdown: GetCategoryDropdown = async tenantId => {
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      const categories = await tenantPrisma.category.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return categories;
    },
    'get category dropdown',
    ['category'] // Category dropdown only needs category table
  );
};

export const getBuiltInCategories: GetBuiltInCategories = async tenantId => {
  const tenantPrisma = TenantPrismaClient.getClient(tenantId);

  return executeWithMigration(
    tenantId,
    async () => {
      const categories = await tenantPrisma.category.findMany({
        orderBy: {
          name: 'asc',
        },
      });

      return categories;
    },
    'get built-in categories',
    ['category'] // Built-in categories only need category table
  );
};
