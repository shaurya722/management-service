import type { Category } from '@/generated';
import type { IAppError } from '@/types';

// Create Category Types
export type CreateCategory = (params: {
  name: string;
  description?: string;
  probes?: string[];
  tenantId: string;
}) => Promise<Category | IAppError>;

// Update Category Types
export type UpdateCategory = (params: {
  id: string;
  name?: string;
  description?: string;
  probes?: string[];
  tenantId: string;
}) => Promise<Category | IAppError>;

// Delete Category Types
export type DeleteCategory = (params: {
  id: string;
  tenantId: string;
}) => Promise<{ message: string } | IAppError>;

// Get Category Types
export type GetCategory = (params: {
  id: string;
  tenantId: string;
}) => Promise<Category | IAppError>;

// List Categories Types
export type ListCategories = (params: {
  page: number;
  limit: number;
  search?: string;
  field?: string;
  sort?: string;
  startDate?: string;
  endDate?: string;
  dateField?: string;
  sortBy?: string;
  tenantId: string;
}) => Promise<
  | {
      docs: Category[];
      totalCount: number;
      totalPages: number;
      currentPage: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    }
  | IAppError
>;

// Get Category Dropdown Types
export type GetCategoryDropdown = (tenantId: string) => Promise<
  | {
      id: string;
      name: string;
    }[]
  | IAppError
>;

// Get Built-in Categories Types
export type GetBuiltInCategories = (tenantId: string) => Promise<Category[] | IAppError>;
