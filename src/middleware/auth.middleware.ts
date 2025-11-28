import config from '@/config';
import { ERequest } from '@/utils/catchAsync';
import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
const { JWT_PUBLIC_KEY } = config;

type Protect = (
  req: ERequest,
  res: Response,
  next: NextFunction
) => Promise<void | undefined | Response<any, Record<string, any>>>;
const protect: Protect = async (req, res, next) => {
  // get jwt from header and verify it
  // if verified, call next()
  // if not verified, return error
  const bearerToken = req.headers.authorization;
  if (!bearerToken) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
      error: 'Unauthorized',
    });
  }
  const token = bearerToken.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
      error: 'Unauthorized',
    });
  }
  try {
    const decoded = jwt.verify(token, JWT_PUBLIC_KEY, { algorithms: ['RS256'] }) as {
      id: string;
      tenantId?: string;
    };
    req.user = decoded;
  } catch (error) {
    console.error(error);
    return res.status(401).json({
      success: false,
      message: 'Unauthorized',
      error: 'Unauthorized',
    });
  }
  next();
  return undefined;
};

export default protect;
