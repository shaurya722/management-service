import type { BlueTeamLog, RedTeamLog } from '../../generated/index';
import type { IAppError } from '@/types';

export interface ListLogsParams {
  tenantId: string;
  type: 'BLUE' | 'RED';
  jobId?: string;
  projectId?: string;
  status?: string;
  isFail?: boolean;
  page?: number;
  limit?: number;

  sortBy?: 'createdAt' | 'status' | 'isFail';
  sortOrder?: 'asc' | 'desc';
  startDate?: Date;
  endDate?: Date;
}

export interface GetLogParams {
  tenantId: string;
  id: string;
  type: 'BLUE' | 'RED';
}

export interface LogsResponse {
  docs: BlueTeamLog[] | RedTeamLog[];
  totalCount: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface LogValidation {
  listLogs: ReturnType<typeof import('@/function/validator').default>;
  getLog: ReturnType<typeof import('@/function/validator').default>;
}

export type ListLogs = (params: ListLogsParams) => Promise<LogsResponse | IAppError>;
export type GetLog = (params: GetLogParams) => Promise<BlueTeamLog | RedTeamLog | null | IAppError>;
