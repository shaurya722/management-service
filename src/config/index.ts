import dotenv from 'dotenv';
import { type StringValue } from 'ms';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Environment configuration interface
 */
export interface Config {
  PORT: number;
  DATABASE_URL: string;
  NODE_ENV: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: StringValue;
  JWT_REFRESH_EXPIRES_IN: StringValue;
  JWT_PUBLIC_KEY: string;
  ENCRYPTION_SECRET: string;
  BCRYPT_SALT_ROUNDS: number;
}

export interface AppConfig extends Config {
  DB_MAX_CONNECTIONS: number;
  DB_IDLE_TIMEOUT: number;
  DB_CONNECTION_TIMEOUT: number;
  CORS_ORIGIN: string[];
  RABBITMQ_URL: string;
  RABBITMQ_REQUEST_QUEUE: string;
  RABBITMQ_REPLY_QUEUE: string;
  RABBITMQ_TIMEOUT: number;
}

/**
 * Application configuration
 */
const config: AppConfig = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL:
    process.env.DATABASE_URL ||
    'postgresql://postgres:password@localhost:5432/auth_service?schema=public',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback-secret-key',
  JWT_EXPIRES_IN: (process.env.JWT_EXPIRES_IN as StringValue) || '24h',
  JWT_REFRESH_EXPIRES_IN: (process.env.JWT_REFRESH_EXPIRES_IN as StringValue) || '30d',
  JWT_PUBLIC_KEY: process.env.JWT_PUBLIC_KEY || 'fallback-public-key',
  ENCRYPTION_SECRET: process.env.ENCRYPTION_SECRET || 'fallback-encryption-key',
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
  CORS_ORIGIN: (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map(origin => origin.trim()),
  DB_MAX_CONNECTIONS: parseInt(process.env.DB_MAX_CONNECTIONS || '20', 10),
  DB_IDLE_TIMEOUT: parseInt(process.env.DB_IDLE_TIMEOUT || '30000', 10),
  DB_CONNECTION_TIMEOUT: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000', 10),
  RABBITMQ_URL: process.env.RABBITMQ_URL || 'amqp:/admin:Aynigma%40%231234@34.18.175.215:5672/',
  RABBITMQ_REQUEST_QUEUE: process.env.RABBITMQ_REQUEST_QUEUE || 'garak_jobs',
  RABBITMQ_REPLY_QUEUE: process.env.RABBITMQ_REPLY_QUEUE || 'garak_jobs_reply',
  RABBITMQ_TIMEOUT: parseInt(process.env.RABBITMQ_TIMEOUT || '30000', 10),
};

// Validate required environment variables
const required = ['DATABASE_URL', 'JWT_SECRET'];
const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
}

export default config;
