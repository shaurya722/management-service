import { NextFunction, Request, Response } from 'express';
export interface ERequest extends Request {
  user: {
    id: string;
    tenantId?: string;
  };
}

/**
 * Catch async errors and pass them to the global error handler
 * This utility wraps async route handlers to automatically catch any thrown errors
 * and pass them to the next() function for global error handling
 */
const catchAsync = (fn: (req: ERequest, res: Response, next: NextFunction) => Promise<void>) => {
  return (req: ERequest, res: Response, next: NextFunction): void => {
    // Execute the async function and catch any errors
    try {
      fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

export default catchAsync;
