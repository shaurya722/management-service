import { createApp, gracefulShutdown } from '@/app';
import config from '@/config';
import { prisma } from '@/config/prisma';

/**
 * Start the authentication microservice server
 */
const startServer = async (): Promise<void> => {
  try {
    // Initialize database connection
    await prisma.$connect();
    // eslint-disable-next-line no-console
    console.log('✅ Prisma database connection established');

    // Create Express application
    const app = createApp();

    // Start server
    const server = app.listen(config.PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`🚀 Server is running on port ${config.PORT}`);
      // eslint-disable-next-line no-console
      console.log(`📡 API available at: http://localhost:${config.PORT}/api/management`);
    });

    // Handle server errors
    server.on('error', (error: Error & { code?: string }) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${config.PORT} is already in use`);
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });

    // Graceful shutdown handlers
    const handleShutdown = (signal: string): void => {
      // eslint-disable-next-line no-console
      console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

      server.close(async () => {
        // eslint-disable-next-line no-console
        console.log('🔌 HTTP server closed');
        await gracefulShutdown(signal);
      });

      // Force shutdown after 10 seconds
      // eslint-disable-next-line no-undef
      setTimeout(() => {
        console.error('❌ Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle process termination signals
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
    process.on('SIGINT', () => handleShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', error => {
      console.error('❌ Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
