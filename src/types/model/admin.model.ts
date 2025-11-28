import { IAppError } from '@/types';

interface CreateAdminParams {
  email: string;
  password: string;
  name: string;
  role?: string;
}
export type CreateAdmin = (
  params: CreateAdminParams
) => Promise<import('@/generated').Admin | IAppError>;

export type LoginAdmin = (params: {
  email: string;
  password: string;
}) => Promise<import('@/generated').Admin | IAppError>;

export type AdminForgotPassword = (params: { email: string }) => Promise<true | IAppError>;

export type AdminResetPassword = (params: {
  email: string;
  password: string;
}) => Promise<true | IAppError>;
