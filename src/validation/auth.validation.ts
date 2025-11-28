import validator from '@/function/validator';
import type { ValidationSchema } from '@/types';
import { emailValidation, passwordValidation, stringValidation } from '@/validation';
import { Joi } from 'express-validation';

export type AdminAuthValidation = {
  registerAdmin: ReturnType<typeof validator>;
  loginAdmin: ReturnType<typeof validator>;
  forgotPassword: ReturnType<typeof validator>;
  resetPassword: ReturnType<typeof validator>;
};

export const registerAdminValidation: ValidationSchema = {
  body: Joi.object({
    email: emailValidation,
    password: passwordValidation,
    name: stringValidation,
    role: stringValidation,
  }),
};

export const loginAdminValidation: ValidationSchema = {
  body: Joi.object({
    email: emailValidation,
    password: passwordValidation,
    rememberMe: Joi.boolean().optional(),
  }),
};

export const forgotPasswordValidation: ValidationSchema = {
  body: Joi.object({
    email: emailValidation,
  }),
};

export const resetPasswordValidation: ValidationSchema = {
  body: Joi.object({
    token: stringValidation,
    newPassword: passwordValidation,
  }),
};
