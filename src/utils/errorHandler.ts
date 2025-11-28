/**
 * Error handling utilities for passing errors through next() middleware
 */

/**
 * Create an error object with status code that can be passed to next()
 */
export const createError = (
  message: string,
  statusCode: number = 500
): Error & { statusCode: number } => {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
};

/**
 * Create a validation error (400)
 */
export const createValidationError = (message: string): Error & { statusCode: number } => {
  return createError(message, 400);
};

/**
 * Create an unauthorized error (401)
 */
export const createUnauthorizedError = (message: string): Error & { statusCode: number } => {
  return createError(message, 401);
};

/**
 * Create a forbidden error (403)
 */
export const createForbiddenError = (message: string): Error & { statusCode: number } => {
  return createError(message, 403);
};

/**
 * Create a not found error (404)
 */
export const createNotFoundError = (message: string): Error & { statusCode: number } => {
  return createError(message, 404);
};

/**
 * Create a conflict error (409)
 */
export const createConflictError = (message: string): Error & { statusCode: number } => {
  return createError(message, 409);
};

/**
 * Create an internal server error (500)
 */
export const createInternalServerError = (
  message: string = 'Internal server error'
): Error & { statusCode: number } => {
  return createError(message, 500);
};
