import { IAppError } from '@/types';

export type CreateProject = (params: {
  name: string;
  description?: string;
  type: 'RED' | 'BLUE' | 'AGENTIC';
  policyId?: string;
  redModelType?:
    | 'REST'
    | 'OPENAI'
    | 'HUGGING_FAVE'
    | 'HUGGING_FACE_INFERENCE_API'
    | 'HUGGING_FACE_INFERENCE_ENDPOINT'
    | 'REPLICATE'
    | 'COHERE'
    | 'GROQ'
    | 'NIM'
    | 'GGML';
  redModelName?: string;
  redModelUrl?: string;
  redModelToken?: string;
  redAuthorizationType?: 'BEARER' | 'API_KEY' | 'NONE';
  redRequestTemplate?: Record<string, unknown>;
  agenticZipUrl?: string;
  blueDomain?: string;
  tenantId: string;
}) => Promise<import('@/generated').Project | IAppError>;

export type UpdateProject = (params: {
  id: string;
  name?: string;
  description?: string;
  type?: 'RED' | 'BLUE' | 'AGENTIC';
  policyId?: string;
  redModelType?:
    | 'REST'
    | 'OPENAI'
    | 'HUGGING_FAVE'
    | 'HUGGING_FACE_INFERENCE_API'
    | 'HUGGING_FACE_INFERENCE_ENDPOINT'
    | 'REPLICATE'
    | 'COHERE'
    | 'GROQ'
    | 'NIM'
    | 'GGML';
  redModelName?: string;
  redModelUrl?: string;
  redModelToken?: string;
  redAuthorizationType?: 'BEARER' | 'API_KEY' | 'NONE';
  redRequestTemplate?: Record<string, unknown>;
  agenticZipUrl?: string;
  blueDomain?: string;
  tenantId: string;
}) => Promise<import('@/generated').Project | IAppError>;

export type DeleteProject = (params: {
  id: string;
  tenantId: string;
}) => Promise<{ message: string } | IAppError>;

export type GetProject = (params: {
  id: string;
  tenantId: string;
}) => Promise<import('@/generated').Project | IAppError>;

export type ListProjects = (params: {
  page: number;
  limit: number;
  search?: string;
  field?: string;
  sort?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
  dateField?: string;
  sortBy?: string;
  tenantId: string;
}) => Promise<
  | {
      docs: import('@/generated').Project[];
      totalCount: number;
      totalPages: number;
      currentPage: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    }
  | IAppError
>;

export type GetProjectDropdown = (params: {
  tenantId: string;
}) => Promise<Array<{ id: string; name: string; type: string }> | IAppError>;
