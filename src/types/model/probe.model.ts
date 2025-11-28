import { IAppError } from '@/types';

export type CreateProbe = (params: {
  probeId: string;
  name: string;
  description?: string;
  tenantId: string;
}) => Promise<import('@/generated').Probe | IAppError>;

export type UpdateProbe = (params: {
  id: string;
  probeId?: string;
  name?: string;
  description?: string;
  tenantId: string;
}) => Promise<import('@/generated').Probe | IAppError>;

export type DeleteProbe = (params: {
  id: string;
  tenantId: string;
}) => Promise<import('@/generated').Probe | IAppError>;

export type GetProbe = (params: {
  id: string;
  tenantId: string;
}) => Promise<import('@/generated').Probe | IAppError>;

export type ListProbes = (params: {
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
      docs: import('@/generated').Probe[];
      totalCount: number;
      totalPages: number;
      currentPage: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    }
  | IAppError
>;

export type GetProbeDropdown = (tenantId: string) => Promise<
  | {
      id: string;
      probeId: string;
      name: string;
    }[]
  | IAppError
>;

export type GetBuiltInProbes = (
  tenantId: string
) => Promise<import('@/generated').Probe[] | IAppError>;
