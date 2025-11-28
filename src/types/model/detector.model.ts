import { IAppError } from '@/types';

export type CreateDetector = (params: {
  detectorName: string;
  description?: string;
  detectorType: string;
  confidence: number;
  regex?: string[];
  tenantId: string;
}) => Promise<import('@/generated').Detectors | IAppError>;

export type UpdateDetector = (params: {
  id: string;
  detectorName?: string;
  description?: string;
  detectorType?: string;
  confidence?: number;
  regex?: string[];
  tenantId: string;
}) => Promise<import('@/generated').Detectors | IAppError>;

export type DeleteDetector = (params: {
  id: string;
  tenantId: string;
}) => Promise<import('@/generated').Detectors | IAppError>;

export type GetDetector = (params: {
  id: string;
  tenantId: string;
}) => Promise<import('@/generated').Detectors | IAppError>;

export type ListDetectors = (params: {
  page: number;
  limit: number;
  search?: string;
  field?: string;
  sort?: string;
  creationType?: string;
  detectorType?: string;
  startDate?: string;
  endDate?: string;
  dateField?: string;
  sortBy?: string;
  tenantId: string;
}) => Promise<
  | {
      docs: import('@/generated').Detectors[];
      totalCount: number;
      totalPages: number;
      currentPage: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    }
  | IAppError
>;

export type GetDetectorDropdown = (tenantId: string) => Promise<
  | {
      id: string;
      detectorName: string;
      detectorType: string;
      creationType: string;
    }[]
  | IAppError
>;

export type GetBuiltInDetectors = (
  tenantId: string
) => Promise<import('@/generated').Detectors[] | IAppError>;
