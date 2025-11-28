import { TenantPrismaClient } from '@/config/prisma';
import type { IAppError } from '@/types';
import { AppError } from './customErrors';

/**
 * Executes a database operation with automatic tenant schema migration handling.
 * This eliminates the need for try-catch-retry patterns in model functions.
 *
 * @param tenantId - The tenant identifier
 * @param operation - A function that performs the database operation
 * @param operationName - A descriptive name for the operation (used in error messages)
 * @returns The result of the operation or an AppError
 */
export async function executeWithMigration<T>(
  tenantId: string,
  operation: () => Promise<T>,
  operationName: string,
  models?: string[]
): Promise<T | IAppError> {
  try {
    // First, try to execute the operation directly
    return await operation();
  } catch (error) {
    console.error(`Error during ${operationName}:`, error);

    // Check if error is related to missing schema/table/enum/column or type mismatch
    const isSchemaError =
      (error instanceof Error && error.message.includes('does not exist')) ||
      (error instanceof Error &&
        error.message.includes('column') &&
        error.message.includes('does not exist')) ||
      (error instanceof Error &&
        error.message.includes('is of type') &&
        error.message.includes('but expression is of type')) || // Enum type mismatch
      (error as any)?.code === 'P2022' || // Prisma error code for missing column
      (error as any)?.meta?.modelName; // Prisma model-related errors

    if (isSchemaError) {
      try {
        console.log(`Attempting schema migration for tenant: ${tenantId}`);

        // Use selective migration if specific models provided, otherwise full migration
        if (models && models.length > 0) {
          await TenantPrismaClient.migrateSelectiveSchema(tenantId, models);
          console.log(`Selective schema migration completed for models: ${models.join(', ')}`);
        } else {
          await TenantPrismaClient.migrateTenantSchema(tenantId);
          console.log(`Full schema migration completed for tenant: ${tenantId}`);
        }

        // Retry the operation after migration
        return await operation();
      } catch (migrationError) {
        console.error(`Error during schema migration for ${operationName}:`, migrationError);
        return AppError(`Failed to ${operationName} after schema migration`, 500);
      }
    }

    // For other types of errors, return a generic error
    return AppError(`Failed to ${operationName}`, 500);
  }
}

/**
 * Executes a database operation that returns a transaction result with automatic schema migration.
 * This is specifically for operations that use Prisma transactions.
 *
 * @param tenantId - The tenant identifier
 * @param operation - A function that performs the database transaction
 * @param operationName - A descriptive name for the operation (used in error messages)
 * @returns The result of the transaction or an AppError
 */
export async function executeTransactionWithMigration<T>(
  tenantId: string,
  operation: () => Promise<T>,
  operationName: string,
  models?: string[]
): Promise<T | IAppError> {
  try {
    // First, try to execute the transaction directly
    return await operation();
  } catch (error) {
    console.error(`Error during ${operationName} transaction:`, error);

    // Check if error is related to missing schema/table/enum
    if (error instanceof Error && error.message.includes('does not exist')) {
      try {
        console.log(`Attempting schema migration for tenant: ${tenantId}`);

        // Use selective migration if specific models provided, otherwise full migration
        if (models && models.length > 0) {
          await TenantPrismaClient.migrateSelectiveSchema(tenantId, models);
          console.log(`Selective schema migration completed for models: ${models.join(', ')}`);
        } else {
          await TenantPrismaClient.migrateTenantSchema(tenantId);
          console.log(`Full schema migration completed for tenant: ${tenantId}`);
        }

        // Retry the transaction after migration
        return await operation();
      } catch (migrationError) {
        console.error(
          `Error during schema migration for ${operationName} transaction:`,
          migrationError
        );
        return AppError(`Failed to ${operationName} after schema migration`, 500);
      }
    }

    // For other types of errors, return a generic error
    return AppError(`Failed to ${operationName}`, 500);
  }
}

/**
 * Pre-checks if tenant schema migration is needed and migrates if necessary.
 * This is a proactive approach that can be used before executing operations.
 *
 * @param tenantId - The tenant identifier
 * @returns Promise that resolves when schema is ready or rejects with error
 */
export async function ensureTenantSchema(tenantId: string, models?: string[]): Promise<void> {
  try {
    // Get tenant client to test schema existence
    const tenantPrisma = TenantPrismaClient.getClient(tenantId);

    // Try a simple query to test if schema exists and is properly set up
    await tenantPrisma.$queryRaw`SELECT 1`;

    // If we get here, schema exists and is working
    return;
  } catch (error) {
    // If error contains "does not exist", migrate the schema
    if (error instanceof Error && error.message.includes('does not exist')) {
      console.log(`Schema missing for tenant: ${tenantId}, migrating...`);

      // Use selective migration if specific models provided, otherwise full migration
      if (models && models.length > 0) {
        await TenantPrismaClient.migrateSelectiveSchema(tenantId, models);
        console.log(`Selective schema migration completed for models: ${models.join(', ')}`);
      } else {
        await TenantPrismaClient.migrateTenantSchema(tenantId);
        console.log(`Full schema migration completed for tenant: ${tenantId}`);
      }
      return;
    }

    // Re-throw other errors
    throw error;
  }
}
