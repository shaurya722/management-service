import { IAppError } from '@/types';

export type ApproveCompany = (params: {
  id: string;
}) => Promise<import('@/generated').Company | IAppError>;

export type RejectCompany = (params: {
  id: string;
  reason: string;
}) => Promise<import('@/generated').Company | IAppError>;

export type DeleteCompany = (params: { id: string }) => Promise<{ message: string } | IAppError>;

export type ListCompany = (params: {
  page: number;
  limit: number;
  search?: string;
  field?: string;
  sort?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  dateField?: string;
  sortBy?: string;
}) => Promise<{
  docs: import('@/generated').Company[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}>;
