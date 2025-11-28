import { RedReport } from '../../generated/index';
import { IAppError } from '@/types';

export type CreateJob = (params: {
  projectId: string;
  status: 'PENDING' | 'STARTED' | 'SUCCESS' | 'RETRY' | 'REVOKED' | 'FAILURE';
  redAuthorizationValue?: string;
  evaluationThreshold?: number;
  agenticReport?: string;
  blueAPIKey?: string;
  tenantId: string;
}) => Promise<import('@/generated').Job | IAppError>;

export type UpdateJob = (params: {
  id: string;
  status?: 'PENDING' | 'STARTED' | 'SUCCESS' | 'RETRY' | 'REVOKED' | 'FAILURE';
  redAuthorizationValue?: string;
  evaluationThreshold?: number;
  agenticReport?: string;
  blueAPIKey?: string;
  tenantId: string;
}) => Promise<import('@/generated').Job | IAppError>;

export type DeleteJob = (params: {
  id: string;
  tenantId: string;
}) => Promise<import('@/generated').Job | IAppError>;

export type GetJob = (params: {
  id: string;
  tenantId: string;
}) => Promise<import('@/generated').Job | IAppError>;

export type ListJobs = (params: {
  page: number;
  limit: number;
  search?: string;
  field?: string;
  sort?: string;
  projectId?: string;
  projectType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  dateField?: string;
  sortBy?: string;
  tenantId: string;
}) => Promise<
  | {
      docs: import('@/generated').Job[];
      totalCount: number;
      totalPages: number;
      currentPage: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    }
  | IAppError
>;

export type GetJobDropdown = (tenantId: string) => Promise<
  | {
      id: string;
      projectId: string;
      status: string;
      projectType: string;
    }[]
  | IAppError
>;

export type GetJobsByProject = (params: {
  projectId: string;
  tenantId: string;
}) => Promise<import('@/generated').Job[] | IAppError>;

export type GetJobsByStatus = (params: {
  status: 'PENDING' | 'STARTED' | 'SUCCESS' | 'RETRY' | 'REVOKED' | 'FAILURE';
  tenantId: string;
}) => Promise<import('@/generated').Job[] | IAppError>;

export interface GetJobReportParams {
  jobId: string;
  tenantId: string;
  month?: number; // 1-12, defaults to current month
  year?: number; // defaults to current year
}

export interface DailyLogData {
  date: string; // YYYY-MM-DD format
  totalLogs: number;
  failedLogs: number;
  failedPercentage: number;
}

export interface ProjectBreakdown {
  projectId: string;
  projectName: string;
  totalLogs: number;
  totalFailedLogs: number;
  failedLogPercentage: number;
}

export interface JobReportResponse {
  totalLogs: number;
  totalFailedLogs: number;
  failedLogPercentage: number;
  projectBreakdown: ProjectBreakdown[];
  dailyLogsGraph: Array<{
    date: string;
    totalLogs: number;
  }>;
  dailyFailedPercentageGraph: Array<{
    date: string;
    failedPercentage: number;
  }>;
}

export type GetJobReport = (
  params: GetJobReportParams
) => Promise<JobReportResponse | RedReport[] | IAppError>;
