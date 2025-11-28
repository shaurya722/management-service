import config from '@/config';
import { IApiResponse } from '@/types';
import { ErrorHandler } from '@/types/middleware/errorHandler.type';
import { isAppError } from '@/utils/customErrors';

const { NODE_ENV } = config;

export const errorHandler: ErrorHandler = (error, _req, res, _next) => {
  console.error('❌ Global error handler:', error);

  // Don't send error details in production
  const isDevelopment = NODE_ENV === 'development';

  // Get status code from error object or default to 500
  const statusCode = error.statusCode || 500;

  if (error.details) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      error: error.details,
    } as IApiResponse);
  }

  // Handle custom AppError instances
  if (isAppError(error)) {
    return res.status(statusCode).json({
      success: false,
      message: error.message,
      error: error.message,
      ...(isDevelopment && { stack: error.stack }),
    } as IApiResponse);
  }

  // Handle errors with status codes passed via next()
  if (error.statusCode) {
    return res.status(statusCode).json({
      success: false,
      message: error.message,
      error: error.message,
      ...(isDevelopment && { stack: error.stack }),
    } as IApiResponse);
  }

  // Handle other errors (default 500)
  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: isDevelopment ? error.message : 'Something went wrong',
    ...(isDevelopment && { stack: error.stack }),
  } as IApiResponse);
};
