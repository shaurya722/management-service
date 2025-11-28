import { prisma } from '@/config/prisma';
import { errorHandler } from '@/middleware/errorHandler.middleware';
import applyMiddleware from '@/middleware/global.middleware';
import router from '@/routes';
import { IApiResponse } from '@/types';
import express, { Application, NextFunction, Request, Response } from 'express';

/**
 * Create and configure Express application
 */
export const createApp = (): Application => {
  const app: Application = express();
  applyMiddleware(app);

  app.use('/api/management', router);

  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      message: 'Route not found',
      error: `Cannot ${req.method} ${req.originalUrl}`,
    } as IApiResponse);
  });

  // Global error handler
  app.use((err: Error & { statusCode?: number }, req: Request, res: Response, next: NextFunction) =>
    errorHandler(err, req, res, next)
  );

  return app;
};

/**
 * Graceful shutdown handler
 */
export const gracefulShutdown = async (signal: string): Promise<void> => {
  // eslint-disable-next-line no-console
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

  try {
    await prisma.$disconnect();
    // eslint-disable-next-line no-console
    console.log('✅ Database connection closed');

    // eslint-disable-next-line no-console
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
};

export default createApp;
