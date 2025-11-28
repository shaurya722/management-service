import { NextFunction, Request, Response } from 'express';

export type ErrorHandler = (
  error: Error & { statusCode?: number; details?: object },
  _req: Request,
  res: Response,
  _next: NextFunction
) => void;
