import config from '@/config';
import i18next from '@/function/il8n';
import { IApiResponse } from '@/types';
import cors from 'cors';
import express, {
  Application,
  Request as ExpressRequestType,
  Response as ExpressResponseType,
  NextFunction,
} from 'express';
import helmet from 'helmet';
import i18nextMiddleware from 'i18next-http-middleware';
import morgan from 'morgan';

type ApplyMiddleware = (app: Application) => Application;

const applyMiddleware: ApplyMiddleware = app => {
  // Add middleware here
  // Trust proxy for accurate IP addresses behind reverse proxies
  app.set('trust proxy', 1);

  // Security middleware
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS configuration
  app.use(
    cors({
      origin: config.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Tenant-ID',
      ],
    })
  );

  // Request logging
  if (config.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request timeout middleware
  app.use((_req: ExpressRequestType, res: ExpressResponseType, next: NextFunction) => {
    res.setTimeout(60000, () => {
      res.status(408).json({
        success: false,
        message: 'Request timeout',
        error: 'The request took too long to process',
      } as IApiResponse);
    });
    next();
  });

  // i18n middleware
  app.use(i18nextMiddleware.handle(i18next));

  return app;
};

export default applyMiddleware;
