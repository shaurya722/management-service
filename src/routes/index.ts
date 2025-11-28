import protect from '@/middleware/auth.middleware';
import { checkRabbitMQHealth } from '@/models/job.model';
import adminRouter from '@/routes/admin';
import companyRouter from '@/routes/company';
import express, { RequestHandler, Router } from 'express';

const router: Router = express.Router();

// Mount all routes under /api/v1
// Health check endpoint
router.get('/health', async (_req, res) => {
  const rabbitMQHealthy = await checkRabbitMQHealth();

  res.status(200).json({
    success: true,
    message: 'Service is healthy',
    data: {
      service: 'management-service',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      rabbitmq: {
        status: rabbitMQHealthy ? 'healthy' : 'unhealthy',
        connected: rabbitMQHealthy,
      },
    },
  });
});

// Root endpoint
router.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Management Microservice API',
    data: {
      service: 'mangement-service',
      version: '1.0.0',
      health: '/health',
    },
  });
});

router.use(protect as RequestHandler);
router.use('/admin', adminRouter);
router.use('/company', companyRouter);

export default router;
