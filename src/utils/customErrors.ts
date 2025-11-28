import type { IAppError } from '@/types';

export const AppError = (message: string, statusCode: number = 500): IAppError => {
  const error = new Error(message) as IAppError;
  error.statusCode = statusCode;
  return error;
};

// check if data type is AppError then return true else false
export const isAppError = (data: unknown): data is IAppError => {
  return data instanceof Error && 'statusCode' in data;
};
