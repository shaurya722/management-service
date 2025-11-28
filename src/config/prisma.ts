import config from '@/config';
import { PrismaClient } from '../generated/index';
import fs from 'node:fs';
import path from 'node:path';
import { v4 as uuidv4 } from 'uuid';
const { DATABASE_URL, NODE_ENV } = config;

// Global Prisma client for main database (admins, companies, audit logs)
export const prisma = new PrismaClient({
  log: NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
});

// Multi-tenant Prisma client factory
// Creates isolated Prisma clients for each tenant schema
export class TenantPrismaClient {
  private static clients: Map<string, PrismaClient> = new Map();

  /**
   * Get or create a Prisma client for a specific tenant
   * @param tenantId - The tenant identifier
   * @returns Prisma client configured for the tenant's schema
   */
  public static getClient(tenantId: string): PrismaClient {
    if (!this.clients.has(tenantId)) {
      const schemaName = `tenant_${tenantId}_schema`;
      const tenantDatabaseUrl = `${process.env.DATABASE_URL}&schema=${schemaName}`;

      const client = new PrismaClient({
        log: NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
        datasources: {
          db: {
            url: tenantDatabaseUrl,
          },
        },
      });

      this.clients.set(tenantId, client);
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    return this.clients.get(tenantId)!;
  }

  /**
   * Create a new tenant schema and initialize tables
   * @param tenantId - The tenant identifier
   */
  public static async createTenantSchema(tenantId: string): Promise<void> {
    const schemaName = `tenant_${tenantId}_schema`;

    try {
      // Create the schema
      await prisma.$executeRawUnsafe(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

      // Create tables in the tenant schema
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "${schemaName}"."users" (
          "id" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "password" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "is_active" BOOLEAN NOT NULL DEFAULT true,
          "last_login_at" TIMESTAMP(3),
          "login_count" INTEGER NOT NULL DEFAULT 0,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "users_pkey" PRIMARY KEY ("id")
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "${schemaName}"."users"("email");
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "${schemaName}"."user_sessions" (
          "id" TEXT NOT NULL,
          "user_id" TEXT NOT NULL,
          "token" TEXT NOT NULL,
          "expires_at" TIMESTAMP(3) NOT NULL,
          "is_active" BOOLEAN NOT NULL DEFAULT true,
          "ip_address" TEXT,
          "user_agent" TEXT,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "user_sessions_token_key" ON "${schemaName}"."user_sessions"("token");
      `);

      await prisma.$executeRawUnsafe(`
        ALTER TABLE "${schemaName}"."user_sessions" 
        ADD CONSTRAINT "user_sessions_user_id_fkey" 
        FOREIGN KEY ("user_id") REFERENCES "${schemaName}"."users"("id") 
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);
      // Create enum types for the tenant schema
      try {
        await prisma.$executeRawUnsafe(`
          CREATE TYPE "${schemaName}"."CreationType" AS ENUM ('BuiltIn', 'External');
        `);
      } catch (_error) {
        // Enum type might already exist, ignore error

        console.warn(`CreationType enum already exists for ${schemaName}`);
      }

      try {
        await prisma.$executeRawUnsafe(`
          CREATE TYPE "${schemaName}"."DetectorType" AS ENUM ('REGEX', 'HEURISTIC', 'PII');
        `);
      } catch (_error) {
        // Enum type might already exist, ignore error

        console.warn(`DetectorType enum already exists for ${schemaName}`);
      }

      try {
        await prisma.$executeRawUnsafe(`
          CREATE TYPE "${schemaName}"."CategoryType" AS ENUM ('Content_Safety_Toxicity', 'Data_Leakage_Privacy', 'Encoding_Obfuscation', 'Full_Scan', 'Jailbreaking_DAN_Attacks', 'Malware_Exploitation', 'Misinformation_Deception', 'Package_Code_Security', 'Prompt_Injection', 'Specialized_Attacks');
        `);
      } catch (_error) {
        // Enum type might already exist, ignore error

        console.warn(`CategoryType enum already exists for ${schemaName}`);
      }

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "${schemaName}"."detectors" (
          "id" TEXT NOT NULL,
          "detector_name" TEXT NOT NULL,
          "description" TEXT,
          "creation_type" "${schemaName}"."CreationType" NOT NULL,
          "detector_type" "${schemaName}"."DetectorType" NOT NULL,
          "confidence" FLOAT NOT NULL,
          "regex" TEXT[],
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "detectors_pkey" PRIMARY KEY ("id")
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "detectors_detector_name_key" ON "${schemaName}"."detectors"("detector_name");
      `);

      // Create probes table
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "${schemaName}"."probes" (
          "id" TEXT NOT NULL,
          "probe_id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "probes_pkey" PRIMARY KEY ("id")
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "probes_probe_id_key" ON "${schemaName}"."probes"("probe_id");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "${schemaName}"."categories" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "is_built_in" BOOLEAN NOT NULL DEFAULT false,
          "probes" TEXT[],
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "categories_name_key" ON "${schemaName}"."categories"("name");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "${schemaName}"."policies" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "type" TEXT NOT NULL,
          "default_detector" BOOLEAN NOT NULL DEFAULT true,

          "anonymize" BOOLEAN NOT NULL DEFAULT false,
          "anonymize_type" TEXT[] NOT NULL DEFAULT '{}',
          "anonymize_hidden_names" TEXT[] NOT NULL DEFAULT '{}',
          "anonymize_allowed_names" TEXT[] NOT NULL DEFAULT '{}',
          "anonymize_preamble" TEXT,
          "anonymize_use_faker" BOOLEAN NOT NULL DEFAULT false,
          "anonymize_threshold" DOUBLE PRECISION,

          "ban_code" BOOLEAN NOT NULL DEFAULT false,
          "ban_code_threshold" DOUBLE PRECISION,

          "ban_competitors" BOOLEAN NOT NULL DEFAULT false,
          "ban_competitors_threshold" DOUBLE PRECISION,
          "ban_competitors_competitors" TEXT[] NOT NULL DEFAULT '{}',

          "ban_substrings" BOOLEAN NOT NULL DEFAULT false,
          "ban_substrings_substrings" TEXT[] NOT NULL DEFAULT '{}',
          "ban_substrings_match_type" TEXT,
          "ban_substrings_case_sensitive" BOOLEAN NOT NULL DEFAULT false,
          "ban_substrings_redact" BOOLEAN NOT NULL DEFAULT false,
          "ban_substrings_contains_all" BOOLEAN NOT NULL DEFAULT false,

          "ban_topics" BOOLEAN NOT NULL DEFAULT false,
          "ban_topics_threshold" DOUBLE PRECISION,
          "ban_topics_topics" TEXT[] NOT NULL DEFAULT '{}',

          "code" BOOLEAN NOT NULL DEFAULT false,
          "code_languages" TEXT[] NOT NULL DEFAULT '{}',
          "code_is_blocked" BOOLEAN NOT NULL DEFAULT false,

          "gibberish" BOOLEAN NOT NULL DEFAULT false,
          "gibberish_threshold" DOUBLE PRECISION,
          "gibberish_match_type" TEXT,

          "language" BOOLEAN NOT NULL DEFAULT false,
          "language_valid_languages" TEXT[] NOT NULL DEFAULT '{}',
          "language_match_type" TEXT,

          "prompt_injection" BOOLEAN NOT NULL DEFAULT false,
          "prompt_injection_threshold" DOUBLE PRECISION,
          "prompt_injection_match_type" TEXT,

          "regex" BOOLEAN NOT NULL DEFAULT false,
          "regex_patterns" TEXT[] NOT NULL DEFAULT '{}',
          "regex_is_blocked" BOOLEAN NOT NULL DEFAULT false,
          "regex_redact" BOOLEAN NOT NULL DEFAULT false,

          "secrets" BOOLEAN NOT NULL DEFAULT false,
          "secrets_redact_mode" TEXT,

          "sentiment" BOOLEAN NOT NULL DEFAULT false,
          "sentiment_threshold" DOUBLE PRECISION,
          "sentiment_match_type" TEXT,

          "token_limit" BOOLEAN NOT NULL DEFAULT false,
          "token_limit_limit" INTEGER,
          "token_limit_encoding_name" TEXT,

          "toxicity" BOOLEAN NOT NULL DEFAULT false,
          "toxicity_threshold" DOUBLE PRECISION,
          "toxicity_match_type" TEXT,

          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "policies_name_key" ON "${schemaName}"."policies"("name");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "${schemaName}"."_PolicyDetectors" (
          "A" TEXT NOT NULL,
          "B" TEXT NOT NULL,

          CONSTRAINT "_PolicyDetectors_AB_pkey" PRIMARY KEY ("A", "B")
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "_PolicyDetectors_B_index" ON "${schemaName}"."_PolicyDetectors"("B");
      `);
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "${schemaName}"."_PolicyCategories" (
          "A" TEXT NOT NULL,
          "B" TEXT NOT NULL,

          CONSTRAINT "_PolicyCategories_AB_pkey" PRIMARY KEY ("A", "B")
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "_PolicyCategories_B_index" ON "${schemaName}"."_PolicyCategories"("B");
      `);

      // Create probe_categories junction table with proper schema
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "${schemaName}"."probe_categories" (
          "probe_id" TEXT NOT NULL,
          "category_id" TEXT NOT NULL,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT "probe_categories_pkey" PRIMARY KEY ("probe_id", "category_id")
        );
      `);

      // Add foreign key constraints for probe_categories junction table
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "${schemaName}"."probe_categories"
        ADD CONSTRAINT "probe_categories_probe_id_fkey"
        FOREIGN KEY ("probe_id") REFERENCES "${schemaName}"."probes"("probe_id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);

      await prisma.$executeRawUnsafe(`
        ALTER TABLE "${schemaName}"."probe_categories"
        ADD CONSTRAINT "probe_categories_category_id_fkey"
        FOREIGN KEY ("category_id") REFERENCES "${schemaName}"."categories"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);

      // Add indexes for better performance
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "probe_categories_probe_id_idx" ON "${schemaName}"."probe_categories"("probe_id");
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "probe_categories_category_id_idx" ON "${schemaName}"."probe_categories"("category_id");
      `);

      // Create enum types for Project and Policy
      try {
        await prisma.$executeRawUnsafe(`
          CREATE TYPE "${schemaName}"."Type" AS ENUM ('RED', 'BLUE', 'AGENTIC');
        `);
      } catch (_error) {
        // Enum type might already exist, ignore error
        console.warn(`Type enum already exists for ${schemaName}`);
      }

      try {
        await prisma.$executeRawUnsafe(`
          CREATE TYPE "${schemaName}"."RedModelType" AS ENUM ('REST', 'OPENAI', 'HUGGING_FAVE', 'HUGGING_FACE_INFERENCE_API', 'HUGGING_FACE_INFERENCE_ENDPOINT', 'REPLICATE', 'COHERE', 'GROQ', 'NIM', 'GGML');
        `);
      } catch (_error) {
        // Enum type might already exist, ignore error
        console.warn(`RedModelType enum already exists for ${schemaName}`);
      }

      try {
        await prisma.$executeRawUnsafe(`
          CREATE TYPE "${schemaName}"."RedAuthorizationType" AS ENUM ('BEARER', 'API_KEY', 'NONE');
        `);
      } catch (_error) {
        // Enum type might already exist, ignore error
        console.warn(`RedAuthorizationType enum already exists for ${schemaName}`);
      }

      try {
        await prisma.$executeRawUnsafe(`
          CREATE TYPE "${schemaName}"."JobStatus" AS ENUM ('PENDING', 'STARTED', 'SUCCESS', 'RETRY', 'REVOKED', 'FAILURE');
        `);
      } catch (_error) {
        // Enum type might already exist, ignore error
        console.warn(`JobStatus enum already exists for ${schemaName}`);
      }

      // Create projects table
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "${schemaName}"."projects" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "type" "${schemaName}"."Type" NOT NULL,
          "model_type" "${schemaName}"."RedModelType",
          "model_name" TEXT,
          "model_url" TEXT,
          "model_token" TEXT,
          "authorization_token" "${schemaName}"."RedAuthorizationType",
          "authorization_key" TEXT,
          "request_template" JSONB,
          "agentic_zip_url" TEXT,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
        );
      `);
      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "projects_name_key" ON "${schemaName}"."projects"("name");
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "${schemaName}"."jobs" (
          "id" TEXT NOT NULL,
          "project_id" TEXT NOT NULL,
          "project_type" "${schemaName}"."Type" NOT NULL,
          "status" "${schemaName}"."JobStatus" NOT NULL,
          "authorization_key" TEXT,
          "evaluation_threshold" DOUBLE PRECISION,
          "agentic_report" TEXT,
          "red_report" JSONB,
          "red_report_enhanced" JSONB,
          "blue_api_key" TEXT,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
        );
      `);

      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "${schemaName}"."jobs"
          ADD CONSTRAINT "jobs_project_id_fkey"
          FOREIGN KEY ("project_id") REFERENCES "${schemaName}"."projects"("id")
          ON DELETE CASCADE ON UPDATE CASCADE;
        `);
      } catch (_error) {
        console.warn(`jobs_project_id_fkey already exists for ${schemaName}`);
      }

      const defaultDetectors: {
        name: string;
        description: string;
        category: string;
        detection_method: string;
        confidence_score: number;
        patterns: string[];
      }[] = JSON.parse(
        await fs.promises.readFile(path.join(__dirname, '../constant/json/detector.json'), 'utf8')
      );

      // Enter default tenant detectors
      await prisma.$executeRawUnsafe(`
        INSERT INTO "${schemaName}"."detectors" (
          "id", "detector_name", "description", "creation_type", "detector_type", "confidence", "regex", "created_at", "updated_at"
        )
        VALUES
        ${defaultDetectors
          .map(
            detector => `(
              '${uuidv4()}', '${detector.name}', '${detector.description}', '${detector.category}', '${detector.detection_method}', ${detector.confidence_score}, ${
                detector.patterns.length > 0
                  ? `ARRAY[${detector.patterns
                      .map(pattern => `'${pattern.replace(/\\/g, '\\\\').replace(/'/g, "''")}'`)
                      .join(',')}]`
                  : 'ARRAY[]::text[]'
              }, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )`
          )
          .join(',')}
        ON CONFLICT("id") DO NOTHING;
        `);

      const defaultProbes: { id: string; name: string; description: string }[] = JSON.parse(
        await fs.promises.readFile(path.join(__dirname, '../constant/json/probe.json'), 'utf8')
      );
      await prisma.$executeRawUnsafe(`
          INSERT INTO "${schemaName}"."probes" (
            "id", "probe_id", "name", "description", "created_at", "updated_at"
          )
          VALUES
          ${defaultProbes
            .map(
              probe => `
            (
              '${uuidv4()}', '${probe.id}', '${probe.name}', '${probe.description || ''}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )
          `
            )
            .join(',')}
          ON CONFLICT("id") DO NOTHING;
        `);

      const defaultCategory: {
        name: string;
        description: string;
        probes: string[];
      }[] = JSON.parse(
        await fs.promises.readFile(path.join(__dirname, '../constant/json/category.json'), 'utf8')
      );
      await prisma.$executeRawUnsafe(`
        INSERT INTO "${schemaName}"."categories" (
          "id", "name", "description","is_built_in", "probes", "created_at", "updated_at"
        )
        VALUES
        ${defaultCategory
          .map(
            category => `(
              '${uuidv4()}', '${category.name}', '${category.description}', true, ${
                category.probes.length > 0
                  ? `ARRAY[${category.probes
                      .map(probe => `'${probe.replace(/\\/g, '\\\\').replace(/'/g, "''")}'`)
                      .join(',')}]`
                  : 'ARRAY[]::text[]'
              }, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            )`
          )
          .join(', ')}
      `);

      // Populate probe_categories junction table with default relationships
      try {
        // eslint-disable-next-line no-console
        console.log(`🔗 Populating probe-category relationships for ${schemaName}...`);

        for (const category of defaultCategory) {
          if (category.probes && category.probes.length > 0) {
            // Get the category ID from the database
            const categoryResult = await prisma.$queryRawUnsafe<{ id: string }[]>(`
              SELECT id FROM "${schemaName}"."categories" WHERE "name" = '${category.name}' LIMIT 1;
            `);

            if (categoryResult.length > 0 && categoryResult[0]) {
              const categoryId = categoryResult[0].id;

              // Create junction table entries for each probe in this category
              const junctionValues = category.probes
                .map(
                  probeId => `('${probeId}', '${categoryId}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
                )
                .join(', ');

              if (junctionValues) {
                await prisma.$executeRawUnsafe(`
                  INSERT INTO "${schemaName}"."probe_categories" ("probe_id", "category_id", "created_at", "updated_at")
                  VALUES ${junctionValues}
                  ON CONFLICT ("probe_id", "category_id") DO NOTHING;
                `);
              }
            }
          }
        }

        // eslint-disable-next-line no-console
        console.log(`✅ Probe-category relationships populated successfully for ${schemaName}`);
      } catch (error) {
        console.error(
          `❌ Failed to populate probe-category relationships for ${schemaName}:`,
          error
        );
        // Don't throw error here as the schema creation was successful
      }

      await this.migrateBlueTeamLogTables(schemaName);

      // eslint-disable-next-line no-console
      console.log(`✅ Tenant schema created successfully: ${schemaName}`);
    } catch (error) {
      console.error(`❌ Failed to create tenant schema: ${schemaName}`, error);
      throw error;
    }
  }

  /**
   * Selective migration for specific models to optimize performance
   * @param tenantId - The tenant identifier
   * @param models - Array of model names to migrate
   */
  public static async migrateSelectiveSchema(tenantId: string, models: string[]): Promise<void> {
    const schemaName = `tenant_${tenantId}_schema`;

    try {
      // Create a set for efficient lookups and handle dependencies
      const modelsToMigrate = new Set<string>();

      // Add requested models and their dependencies
      for (const model of models) {
        this.addModelWithDependencies(model, modelsToMigrate);
      }

      // Migrate enums first (they're dependencies for many models)
      if (
        modelsToMigrate.has('detector') ||
        modelsToMigrate.has('CreationType') ||
        modelsToMigrate.has('DetectorType')
      ) {
        await this.migrateDetectorEnums(schemaName);
      }

      if (
        modelsToMigrate.has('project') ||
        modelsToMigrate.has('Type') ||
        modelsToMigrate.has('RedModelType') ||
        modelsToMigrate.has('RedAuthorizationType')
      ) {
        await this.migrateProjectEnums(schemaName);
      }

      if (modelsToMigrate.has('job') || modelsToMigrate.has('JobStatus')) {
        await this.migrateJobEnums(schemaName);
      }

      // Migrate tables in dependency order
      if (modelsToMigrate.has('user')) {
        await this.migrateUserTables(schemaName);
      }

      if (modelsToMigrate.has('probe')) {
        await this.migrateProbeTables(schemaName);
      }

      if (modelsToMigrate.has('category')) {
        await this.migrateCategoryTables(schemaName);
      }

      if (modelsToMigrate.has('detector')) {
        await this.migrateDetectorTables(schemaName);
      }

      if (modelsToMigrate.has('policy')) {
        await this.migratePolicyTables(schemaName);
      }

      if (modelsToMigrate.has('project')) {
        await this.migrateProjectTables(schemaName);
      }

      if (modelsToMigrate.has('job')) {
        await this.migrateJobTables(schemaName);
      }

      if (modelsToMigrate.has('blueteamlog')) {
        await this.migrateBlueTeamLogTables(schemaName);
      }

      if (modelsToMigrate.has('redreport')) {
        await this.migrateRedReportTables(schemaName);
      }
      
      if (modelsToMigrate.has('log')) {
        await this.migrateLogTables(schemaName);
      }
      
      if (modelsToMigrate.has('redteamlog')) {
        await this.migrateRedTeamLogTables(schemaName);
      }
      

      console.log(
        `✅ Selective migration completed for models: ${Array.from(modelsToMigrate).join(', ')}`
      );
    } catch (error) {
      console.error(`❌ Failed to migrate selective schema for tenant: ${tenantId}`, error);
      throw error;
    }
  }

  // migrate redreport tables

  private static async migrateRedReportTables(schemaName: string): Promise<void> {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."red_reports" (
        "id" TEXT NOT NULL,
        "job_id" TEXT NOT NULL,
        "job_status" TEXT NOT NULL,
        "result" JSONB NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
        CONSTRAINT "red_reports_pkey" PRIMARY KEY ("id")
      );
    `);
  
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "red_reports_job_id_idx" ON "${schemaName}"."red_reports"("job_id");
    `);
  
    // Add foreign key constraint
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "${schemaName}"."red_reports"
        ADD CONSTRAINT "red_reports_job_id_fkey"
        FOREIGN KEY ("job_id") REFERENCES "${schemaName}"."jobs"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    } catch (_error) {
      // Constraint might already exist
    }
  
    console.log(`✅ RedReport tables migrated for schema: ${schemaName}`);
  }
  
  /**
   * Migrate log tables
   */
  private static async migrateLogTables(schemaName: string): Promise<void> {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."logs" (
        "id" TEXT NOT NULL,
        "job_id" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "level" TEXT NOT NULL,
        "timestamp" TIMESTAMP(3) NOT NULL,
        "data" JSONB,
        "status" TEXT,
  
        CONSTRAINT "logs_pkey" PRIMARY KEY ("id")
      );
    `);
  
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "logs_job_id_idx" ON "${schemaName}"."logs"("job_id");
    `);
  
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "logs_timestamp_idx" ON "${schemaName}"."logs"("timestamp");
    `);
  
    // Add foreign key constraint
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "${schemaName}"."logs"
        ADD CONSTRAINT "logs_job_id_fkey"
        FOREIGN KEY ("job_id") REFERENCES "${schemaName}"."jobs"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    } catch (_error) {
      // Constraint might already exist
    }
  
    console.log(`✅ Log tables migrated for schema: ${schemaName}`);
  }
  
  /**
   * Migrate red team log tables
   */
  private static async migrateRedTeamLogTables(schemaName: string): Promise<void> {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."redteam_logs" (
        "id" TEXT NOT NULL,
        "job_id" TEXT NOT NULL,
        "project_id" TEXT NOT NULL,
        "policy_id" TEXT NOT NULL,
        "job_status" TEXT NOT NULL,
        "timestamp" TIMESTAMP(3) NOT NULL,
  
        CONSTRAINT "redteam_logs_pkey" PRIMARY KEY ("id")
      );
    `);
  
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "redteam_logs_job_id_idx" ON "${schemaName}"."redteam_logs"("job_id");
    `);
  
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "redteam_logs_project_id_idx" ON "${schemaName}"."redteam_logs"("project_id");
    `);
  
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "redteam_logs_timestamp_idx" ON "${schemaName}"."redteam_logs"("timestamp");
    `);
  
    // Add foreign key constraints
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "${schemaName}"."redteam_logs"
        ADD CONSTRAINT "redteam_logs_job_id_fkey"
        FOREIGN KEY ("job_id") REFERENCES "${schemaName}"."jobs"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    } catch (_error) {
      // Constraint might already exist
    }
  
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "${schemaName}"."redteam_logs"
        ADD CONSTRAINT "redteam_logs_project_id_fkey"
        FOREIGN KEY ("project_id") REFERENCES "${schemaName}"."projects"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    } catch (_error) {
      // Constraint might already exist
    }
  
    console.log(`✅ RedTeamLog tables migrated for schema: ${schemaName}`);
  }

  /**
   * Add model with its dependencies to the migration set
   */
  private static addModelWithDependencies(model: string, modelsSet: Set<string>): void {
    const modelLower = model.toLowerCase();
    modelsSet.add(modelLower);

    // Add dependencies based on model relationships
    switch (modelLower) {
      case 'category':
        modelsSet.add('probe'); // Categories have relationships with probes
        break;
      case 'policy':
        modelsSet.add('detector'); // Policies have relationships with detectors
        modelsSet.add('category'); // Policies have relationships with categories
        modelsSet.add('probe'); // Indirect dependency through categories
        break;
      case 'project':
        modelsSet.add('policy'); // Projects have optional foreign key to policies
        break;
      case 'job':
        modelsSet.add('project'); // Jobs have foreign key to projects
        modelsSet.add('policy'); // Indirect dependency through projects
        break;
      case 'redreport':
        modelsSet.add('job');
        break;
      case 'log':
        modelsSet.add('job');
        break;
      case 'redlog':
        modelsSet.add('job');
        break;
      // Other models don't have critical dependencies for basic operations
    }
  }

  /**
   * Migrate existing tenant schema to include enum types and missing tables
   * @param tenantId - The tenant identifier
   */
  public static async migrateTenantSchema(tenantId: string): Promise<void> {
    const schemaName = `tenant_${tenantId}_schema`;

    try {
      // Create enum types if they don't exist
      try {
        await prisma.$executeRawUnsafe(`
          CREATE TYPE "${schemaName}"."CreationType" AS ENUM ('BuiltIn', 'External');
        `);
      } catch (_error) {
        // Enum already exists
      }

      try {
        await prisma.$executeRawUnsafe(`
          CREATE TYPE "${schemaName}"."DetectorType" AS ENUM ('REGEX', 'HEURISTIC', 'PII');
        `);
      } catch (_error) {
        // Enum already exists
      }

      try {
        await prisma.$executeRawUnsafe(`
          CREATE TYPE "${schemaName}"."CategoryType" AS ENUM ('Content_Safety_Toxicity', 'Data_Leakage_Privacy', 'Encoding_Obfuscation', 'Full_Scan', 'Jailbreaking_DAN_Attacks', 'Malware_Exploitation', 'Misinformation_Deception', 'Package_Code_Security', 'Prompt_Injection', 'Specialized_Attacks');
        `);
      } catch (_error) {
        // Enum already exists
      }

      // Create probes table if it doesn't exist
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "${schemaName}"."probes" (
          "id" TEXT NOT NULL,
          "probe_id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "probes_pkey" PRIMARY KEY ("id")
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "probes_probe_id_key" ON "${schemaName}"."probes"("probe_id");
      `);

      // Seed probes data if table is empty
      const probeCount = await prisma.$queryRawUnsafe<{ count: number }[]>(`
        SELECT COUNT(*) as count FROM "${schemaName}"."probes";
      `);

      if (probeCount[0]?.count === 0) {
        const defaultProbes: { id: string; name: string; description: string }[] = JSON.parse(
          await fs.promises.readFile(path.join(__dirname, '../constant/json/probe.json'), 'utf8')
        );

        if (defaultProbes.length > 0) {
          await prisma.$executeRawUnsafe(`
            INSERT INTO "${schemaName}"."probes" (
              "id", "probe_id", "name", "description", "created_at", "updated_at"
            )
            VALUES
            ${defaultProbes
              .map(
                probe => `(
                  '${uuidv4()}', '${probe.id}', '${probe.name}', '${probe.description || ''}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                )`
              )
              .join(',')}
            ON CONFLICT("id") DO NOTHING;
          `);
        }
      }

      // Seed categories data if table is empty
      const categoryCount = await prisma.$queryRawUnsafe<{ count: number }[]>(`
        SELECT COUNT(*) as count FROM "${schemaName}"."categories";
      `);

      if (categoryCount[0]?.count === 0) {
        const defaultCategories: {
          name: string;
          description: string;
          probes: string[];
        }[] = JSON.parse(
          await fs.promises.readFile(path.join(__dirname, '../constant/json/category.json'), 'utf8')
        );

        if (defaultCategories.length > 0) {
          await prisma.$executeRawUnsafe(`
            INSERT INTO "${schemaName}"."categories" (
              "id", "name", "description", "is_built_in", "probes", "created_at", "updated_at"
            )
            VALUES
            ${defaultCategories
              .map(
                category => `(
                  '${uuidv4()}', '${category.name}', '${category.description}', true, ${
                    category.probes.length > 0
                      ? `ARRAY[${category.probes
                          .map(probe => `'${probe.replace(/\\/g, '\\\\').replace(/'/g, "''")}'`)
                          .join(',')}]`
                      : 'ARRAY[]::text[]'
                  }, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                )`
              )
              .join(',')}
            ON CONFLICT("id") DO NOTHING;
          `);

          // Populate probe_categories junction table with default relationships
          try {
            // eslint-disable-next-line no-console
            console.log(`🔗 Populating probe-category relationships for ${schemaName}...`);

            // Check if junction table is empty
            const junctionCount = await prisma.$queryRawUnsafe<{ count: number }[]>(`
              SELECT COUNT(*) as count FROM "${schemaName}"."probe_categories";
            `);

            if (junctionCount[0]?.count === 0) {
              for (const category of defaultCategories) {
                if (category.probes && category.probes.length > 0) {
                  // Get the category ID from the database
                  const categoryResult = await prisma.$queryRawUnsafe<{ id: string }[]>(`
                    SELECT id FROM "${schemaName}"."categories" WHERE "name" = '${category.name}' LIMIT 1;
                  `);

                  if (categoryResult.length > 0 && categoryResult[0]) {
                    const categoryId = categoryResult[0].id;

                    // Create junction table entries for each probe in this category
                    const junctionValues = category.probes
                      .map(
                        probeId =>
                          `('${probeId}', '${categoryId}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
                      )
                      .join(', ');

                    if (junctionValues) {
                      await prisma.$executeRawUnsafe(`
                        INSERT INTO "${schemaName}"."probe_categories" ("probe_id", "category_id", "created_at", "updated_at")
                        VALUES ${junctionValues}
                        ON CONFLICT ("probe_id", "category_id") DO NOTHING;
                      `);
                    }
                  }
                }
              }

              // eslint-disable-next-line no-console
              console.log(
                `✅ Probe-category relationships populated successfully for ${schemaName}`
              );
            } else {
              // eslint-disable-next-line no-console
              console.log(
                `ℹ️ Probe-category relationships already exist for ${schemaName}, skipping population`
              );
            }
          } catch (error) {
            console.error(
              `❌ Failed to populate probe-category relationships for ${schemaName}:`,
              error
            );
            // Don't throw error here as the migration was successful
          }
        }
      }

      // Check if policies table exists
      const policiesTableExists = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(`
        SELECT EXISTS(
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = '${schemaName}'
          AND table_name = 'policies'
        ) as exists;
      `);

      if (!policiesTableExists[0]?.exists) {
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "${schemaName}"."policies" (
            "id" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "description" TEXT,
            "type" TEXT NOT NULL,
            "default_detector" BOOLEAN NOT NULL DEFAULT true,

            "anonymize" BOOLEAN NOT NULL DEFAULT false,
            "anonymize_type" TEXT[] NOT NULL DEFAULT '{}',
            "anonymize_hidden_names" TEXT[] NOT NULL DEFAULT '{}',
            "anonymize_allowed_names" TEXT[] NOT NULL DEFAULT '{}',
            "anonymize_preamble" TEXT,
            "anonymize_use_faker" BOOLEAN NOT NULL DEFAULT false,
            "anonymize_threshold" DOUBLE PRECISION,

            "ban_code" BOOLEAN NOT NULL DEFAULT false,
            "ban_code_threshold" DOUBLE PRECISION,

            "ban_competitors" BOOLEAN NOT NULL DEFAULT false,
            "ban_competitors_threshold" DOUBLE PRECISION,
            "ban_competitors_competitors" TEXT[] NOT NULL DEFAULT '{}',

            "ban_substrings" BOOLEAN NOT NULL DEFAULT false,
            "ban_substrings_substrings" TEXT[] NOT NULL DEFAULT '{}',
            "ban_substrings_match_type" TEXT,
            "ban_substrings_case_sensitive" BOOLEAN NOT NULL DEFAULT false,
            "ban_substrings_redact" BOOLEAN NOT NULL DEFAULT false,
            "ban_substrings_contains_all" BOOLEAN NOT NULL DEFAULT false,

            "ban_topics" BOOLEAN NOT NULL DEFAULT false,
            "ban_topics_threshold" DOUBLE PRECISION,
            "ban_topics_topics" TEXT[] NOT NULL DEFAULT '{}',

            "code" BOOLEAN NOT NULL DEFAULT false,
            "code_languages" TEXT[] NOT NULL DEFAULT '{}',
            "code_is_blocked" BOOLEAN NOT NULL DEFAULT false,

            "gibberish" BOOLEAN NOT NULL DEFAULT false,
            "gibberish_threshold" DOUBLE PRECISION,
            "gibberish_match_type" TEXT,

            "language" BOOLEAN NOT NULL DEFAULT false,
            "language_valid_languages" TEXT[] NOT NULL DEFAULT '{}',
            "language_match_type" TEXT,

            "prompt_injection" BOOLEAN NOT NULL DEFAULT false,
            "prompt_injection_threshold" DOUBLE PRECISION,
            "prompt_injection_match_type" TEXT,

            "regex" BOOLEAN NOT NULL DEFAULT false,
            "regex_patterns" TEXT[] NOT NULL DEFAULT '{}',
            "regex_is_blocked" BOOLEAN NOT NULL DEFAULT false,
            "regex_redact" BOOLEAN NOT NULL DEFAULT false,

            "secrets" BOOLEAN NOT NULL DEFAULT false,
            "secrets_redact_mode" TEXT,

            "sentiment" BOOLEAN NOT NULL DEFAULT false,
            "sentiment_threshold" DOUBLE PRECISION,
            "sentiment_match_type" TEXT,

            "token_limit" BOOLEAN NOT NULL DEFAULT false,
            "token_limit_limit" INTEGER,
            "token_limit_encoding_name" TEXT,

            "toxicity" BOOLEAN NOT NULL DEFAULT false,
            "toxicity_threshold" DOUBLE PRECISION,
            "toxicity_match_type" TEXT,

            "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updated_at" TIMESTAMP(3) NOT NULL,

            CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
          );
        `);
        await prisma.$executeRawUnsafe(`
          CREATE UNIQUE INDEX IF NOT EXISTS "policies_name_key" ON "${schemaName}"."policies"("name");
        `);
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "${schemaName}"."_PolicyDetectors" (
            "A" TEXT NOT NULL,
            "B" TEXT NOT NULL,

            CONSTRAINT "_PolicyDetectors_AB_pkey" PRIMARY KEY ("A", "B")
          );
        `);
        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS "_PolicyDetectors_B_index" ON "${schemaName}"."_PolicyDetectors"("B");
        `);
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "${schemaName}"."_PolicyCategories" (
            "A" TEXT NOT NULL,
            "B" TEXT NOT NULL,

            CONSTRAINT "_PolicyCategories_AB_pkey" PRIMARY KEY ("A", "B")
          );
        `);
        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS "_PolicyCategories_B_index" ON "${schemaName}"."_PolicyCategories"("B");
        `);

        // Create probe_categories junction table with proper schema
        await prisma.$executeRawUnsafe(`
          CREATE TABLE IF NOT EXISTS "${schemaName}"."probe_categories" (
            "probe_id" TEXT NOT NULL,
            "category_id" TEXT NOT NULL,
            "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "probe_categories_pkey" PRIMARY KEY ("probe_id", "category_id")
          );
        `);

        // Add foreign key constraints for probe_categories junction table
        try {
          await prisma.$executeRawUnsafe(`
            ALTER TABLE "${schemaName}"."probe_categories"
            ADD CONSTRAINT "probe_categories_probe_id_fkey"
            FOREIGN KEY ("probe_id") REFERENCES "${schemaName}"."probes"("probe_id")
            ON DELETE CASCADE ON UPDATE CASCADE;
          `);
        } catch (_error) {
          // Constraint might already exist
        }

        try {
          await prisma.$executeRawUnsafe(`
            ALTER TABLE "${schemaName}"."probe_categories"
            ADD CONSTRAINT "probe_categories_category_id_fkey"
            FOREIGN KEY ("category_id") REFERENCES "${schemaName}"."categories"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
          `);
        } catch (_error) {
          // Constraint might already exist
        }

        // Add indexes for better performance
        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS "probe_categories_probe_id_idx" ON "${schemaName}"."probe_categories"("probe_id");
        `);

        await prisma.$executeRawUnsafe(`
          CREATE INDEX IF NOT EXISTS "probe_categories_category_id_idx" ON "${schemaName}"."probe_categories"("category_id");
        `);

        // Seed policies data
        const defaultPolicies: {
          name: string;
          description: string;
          defaultDetector: boolean;
          detectors: string[];
          categories: string[];
        }[] = JSON.parse(
          await fs.promises.readFile(path.join(__dirname, '../constant/json/policy.json'), 'utf8')
        );

        if (defaultPolicies.length > 0) {
          // Insert policies
          await prisma.$executeRawUnsafe(`
            INSERT INTO "${schemaName}"."policies" (
              "id", "name", "description", "default_detector", "created_at", "updated_at"
            )
            VALUES
            ${defaultPolicies
              .map(
                policy => `(
                  '${uuidv4()}', '${policy.name}', '${policy.description}', ${policy.defaultDetector}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                )`
              )
              .join(',')}
            ON CONFLICT("name") DO NOTHING;
          `);
        }
      }

      // Check if detectors table exists and has TEXT columns
      const tableInfo = await prisma.$queryRawUnsafe<{ column_name: string; data_type: string }[]>(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = '${schemaName}'
        AND table_name = 'detectors'
        AND column_name IN ('creation_type', 'detector_type');
      `);

      const hasTextColumns = tableInfo.some(col => col.data_type === 'text');

      if (hasTextColumns) {
        // Alter table to use enum types
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "${schemaName}"."detectors"
          ALTER COLUMN "creation_type" TYPE "${schemaName}"."CreationType"
          USING "creation_type"::"${schemaName}"."CreationType";
        `);

        await prisma.$executeRawUnsafe(`
          ALTER TABLE "${schemaName}"."detectors"
          ALTER COLUMN "detector_type" TYPE "${schemaName}"."DetectorType"
          USING "detector_type"::"${schemaName}"."DetectorType";
        `);
      }

      // Create policies table if it doesn't exist
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "${schemaName}"."policies" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "type" TEXT NOT NULL,
          "default_detector" BOOLEAN NOT NULL DEFAULT true,

          "anonymize" BOOLEAN NOT NULL DEFAULT false,
          "anonymize_type" TEXT[] NOT NULL DEFAULT '{}',
          "anonymize_hidden_names" TEXT[] NOT NULL DEFAULT '{}',
          "anonymize_allowed_names" TEXT[] NOT NULL DEFAULT '{}',
          "anonymize_preamble" TEXT,
          "anonymize_use_faker" BOOLEAN NOT NULL DEFAULT false,
          "anonymize_threshold" DOUBLE PRECISION,

          "ban_code" BOOLEAN NOT NULL DEFAULT false,
          "ban_code_threshold" DOUBLE PRECISION,

          "ban_competitors" BOOLEAN NOT NULL DEFAULT false,
          "ban_competitors_threshold" DOUBLE PRECISION,
          "ban_competitors_competitors" TEXT[] NOT NULL DEFAULT '{}',

          "ban_substrings" BOOLEAN NOT NULL DEFAULT false,
          "ban_substrings_substrings" TEXT[] NOT NULL DEFAULT '{}',
          "ban_substrings_match_type" TEXT,
          "ban_substrings_case_sensitive" BOOLEAN NOT NULL DEFAULT false,
          "ban_substrings_redact" BOOLEAN NOT NULL DEFAULT false,
          "ban_substrings_contains_all" BOOLEAN NOT NULL DEFAULT false,

          "ban_topics" BOOLEAN NOT NULL DEFAULT false,
          "ban_topics_threshold" DOUBLE PRECISION,
          "ban_topics_topics" TEXT[] NOT NULL DEFAULT '{}',

          "code" BOOLEAN NOT NULL DEFAULT false,
          "code_languages" TEXT[] NOT NULL DEFAULT '{}',
          "code_is_blocked" BOOLEAN NOT NULL DEFAULT false,

          "gibberish" BOOLEAN NOT NULL DEFAULT false,
          "gibberish_threshold" DOUBLE PRECISION,
          "gibberish_match_type" TEXT,

          "language" BOOLEAN NOT NULL DEFAULT false,
          "language_valid_languages" TEXT[] NOT NULL DEFAULT '{}',
          "language_match_type" TEXT,

          "prompt_injection" BOOLEAN NOT NULL DEFAULT false,
          "prompt_injection_threshold" DOUBLE PRECISION,
          "prompt_injection_match_type" TEXT,

          "regex" BOOLEAN NOT NULL DEFAULT false,
          "regex_patterns" TEXT[] NOT NULL DEFAULT '{}',
          "regex_is_blocked" BOOLEAN NOT NULL DEFAULT false,
          "regex_redact" BOOLEAN NOT NULL DEFAULT false,

          "secrets" BOOLEAN NOT NULL DEFAULT false,
          "secrets_redact_mode" TEXT,

          "sentiment" BOOLEAN NOT NULL DEFAULT false,
          "sentiment_threshold" DOUBLE PRECISION,
          "sentiment_match_type" TEXT,

          "token_limit" BOOLEAN NOT NULL DEFAULT false,
          "token_limit_limit" INTEGER,
          "token_limit_encoding_name" TEXT,

          "toxicity" BOOLEAN NOT NULL DEFAULT false,
          "toxicity_threshold" DOUBLE PRECISION,
          "toxicity_match_type" TEXT,

          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "policies_name_key" ON "${schemaName}"."policies"("name");
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "${schemaName}"."_PolicyDetectors" (
          "A" TEXT NOT NULL,
          "B" TEXT NOT NULL,

          CONSTRAINT "_PolicyDetectors_AB_pkey" PRIMARY KEY ("A", "B")
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "_PolicyDetectors_B_index" ON "${schemaName}"."_PolicyDetectors"("B");
      `);

      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "${schemaName}"."_PolicyCategories" (
          "A" TEXT NOT NULL,
          "B" TEXT NOT NULL,

          CONSTRAINT "_PolicyCategories_AB_pkey" PRIMARY KEY ("A", "B")
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "_PolicyCategories_B_index" ON "${schemaName}"."_PolicyCategories"("B");
      `);

      // Create probe_categories junction table with proper schema
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "${schemaName}"."probe_categories" (
          "probe_id" TEXT NOT NULL,
          "category_id" TEXT NOT NULL,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

          CONSTRAINT "probe_categories_pkey" PRIMARY KEY ("probe_id", "category_id")
        );
      `);

      // Add foreign key constraints for probe_categories junction table
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "${schemaName}"."probe_categories"
          ADD CONSTRAINT "probe_categories_probe_id_fkey"
          FOREIGN KEY ("probe_id") REFERENCES "${schemaName}"."probes"("probe_id")
          ON DELETE CASCADE ON UPDATE CASCADE;
        `);
      } catch (_error) {
        // Constraint might already exist
      }

      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "${schemaName}"."probe_categories"
          ADD CONSTRAINT "probe_categories_category_id_fkey"
          FOREIGN KEY ("category_id") REFERENCES "${schemaName}"."categories"("id")
          ON DELETE CASCADE ON UPDATE CASCADE;
        `);
      } catch (_error) {
        // Constraint might already exist
      }

      // Add indexes for better performance
      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "probe_categories_probe_id_idx" ON "${schemaName}"."probe_categories"("probe_id");
      `);

      await prisma.$executeRawUnsafe(`
        CREATE INDEX IF NOT EXISTS "probe_categories_category_id_idx" ON "${schemaName}"."probe_categories"("category_id");
      `);

      // Create enum types for Project and Policy if they don't exist
      try {
        await prisma.$executeRawUnsafe(`
          CREATE TYPE "${schemaName}"."Type" AS ENUM ('RED', 'BLUE', 'AGENTIC');
        `);
      } catch (_error) {
        // Enum already exists
      }

      try {
        await prisma.$executeRawUnsafe(`
          CREATE TYPE "${schemaName}"."RedModelType" AS ENUM ('REST', 'OPENAI', 'HUGGING_FAVE', 'HUGGING_FACE_INFERENCE_API', 'HUGGING_FACE_INFERENCE_ENDPOINT', 'REPLICATE', 'COHERE', 'GROQ', 'NIM', 'GGML');
        `);
      } catch (_error) {
        // Enum already exists
      }

      try {
        await prisma.$executeRawUnsafe(`
          CREATE TYPE "${schemaName}"."RedAuthorizationType" AS ENUM ('BEARER', 'API_KEY', 'NONE');
        `);
      } catch (_error) {
        // Enum already exists
      }

      // Create projects table if it doesn't exist
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "${schemaName}"."projects" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "type" "${schemaName}"."Type" NOT NULL,
          "model_type" "${schemaName}"."RedModelType",
          "model_name" TEXT,
          "model_url" TEXT,
          "model_token" TEXT,
          "authorization_token" "${schemaName}"."RedAuthorizationType",
          "authorization_key" TEXT,
          "request_template" JSONB,
          "agentic_zip_url" TEXT,
          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" TIMESTAMP(3) NOT NULL,

          CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
        );
      `);

      await prisma.$executeRawUnsafe(`
        CREATE UNIQUE INDEX IF NOT EXISTS "projects_name_key" ON "${schemaName}"."projects"("name");
      `);

      // Seed policies data if table is empty
      const policyCount = await prisma.$queryRawUnsafe<{ count: number }[]>(`
        SELECT COUNT(*) as count FROM "${schemaName}"."policies";
      `);

      if (policyCount[0]?.count === 0) {
        const defaultPolicies: {
          name: string;
          description: string;
          defaultDetector: boolean;
          detectors: string[];
          categories: string[];
        }[] = JSON.parse(
          await fs.promises.readFile(path.join(__dirname, '../constant/json/policy.json'), 'utf8')
        );

        if (defaultPolicies.length > 0) {
          await prisma.$executeRawUnsafe(`
            INSERT INTO "${schemaName}"."policies" (
              "id", "name", "description", "default_detector", "created_at", "updated_at"
            )
            VALUES
            ${defaultPolicies
              .map(
                policy => `(
                  '${uuidv4()}', '${policy.name}', '${policy.description}', ${policy.defaultDetector}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                )`
              )
              .join(',')}
            ON CONFLICT("name") DO NOTHING;
          `);
        }
      }

      // eslint-disable-next-line no-console
      console.log(`✅ Migrated tenant schema successfully: ${schemaName}`);
    } catch (error) {
      console.error(`❌ Failed to migrate tenant schema: ${schemaName}`, error);
      throw error;
    }
  }

  /**
   * Migrate detector-related enums
   */
  private static async migrateDetectorEnums(schemaName: string): Promise<void> {
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TYPE "${schemaName}"."CreationType" AS ENUM ('BuiltIn', 'External');
      `);
    } catch (_error) {
      // Enum already exists
    }

    try {
      await prisma.$executeRawUnsafe(`
        CREATE TYPE "${schemaName}"."DetectorType" AS ENUM ('REGEX', 'HEURISTIC', 'PII');
      `);
    } catch (_error) {
      // Enum already exists
    }
  }

  /**
   * Migrate project-related enums
   */
  private static async migrateProjectEnums(schemaName: string): Promise<void> {
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TYPE "${schemaName}"."Type" AS ENUM ('RED', 'BLUE', 'AGENTIC');
      `);
    } catch (_error) {
      // Enum already exists
    }

    try {
      await prisma.$executeRawUnsafe(`
        CREATE TYPE "${schemaName}"."RedModelType" AS ENUM ('REST', 'OPENAI', 'HUGGING_FAVE', 'HUGGING_FACE_INFERENCE_API', 'HUGGING_FACE_INFERENCE_ENDPOINT', 'REPLICATE', 'COHERE', 'GROQ', 'NIM', 'GGML');
      `);
    } catch (_error) {
      // Enum already exists
    }

    try {
      await prisma.$executeRawUnsafe(`
        CREATE TYPE "${schemaName}"."RedAuthorizationType" AS ENUM ('BEARER', 'API_KEY', 'NONE');
      `);
    } catch (_error) {
      // Enum already exists
    }
  }

  /**
   * Migrate job-related enums
   */
  private static async migrateJobEnums(schemaName: string): Promise<void> {
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TYPE "${schemaName}"."JobStatus" AS ENUM ('PENDING', 'STARTED', 'SUCCESS', 'RETRY', 'REVOKED', 'FAILURE');
      `);
    } catch (_error) {
      // Enum already exists
    }
  }

  /**
   * Migrate user-related tables
   */
  private static async migrateUserTables(schemaName: string): Promise<void> {
    // Create users table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."users" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "last_login_at" TIMESTAMP(3),
        "login_count" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "users_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "${schemaName}"."users"("email");
    `);

    // Create user_sessions table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."user_sessions" (
        "id" TEXT NOT NULL,
        "user_id" TEXT NOT NULL,
        "token" TEXT NOT NULL,
        "expires_at" TIMESTAMP(3) NOT NULL,
        "is_active" BOOLEAN NOT NULL DEFAULT true,
        "ip_address" TEXT,
        "user_agent" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "user_sessions_token_key" ON "${schemaName}"."user_sessions"("token");
    `);

    // Add foreign key constraint
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "${schemaName}"."user_sessions"
        ADD CONSTRAINT "user_sessions_user_id_fkey"
        FOREIGN KEY ("user_id") REFERENCES "${schemaName}"."users"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    } catch (_error) {
      // Constraint might already exist
    }
  }

  /**
   * Migrate probe-related tables
   */
  private static async migrateProbeTables(schemaName: string): Promise<void> {
    // Create probes table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."probes" (
        "id" TEXT NOT NULL,
        "probe_id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "probes_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "probes_probe_id_key" ON "${schemaName}"."probes"("probe_id");
    `);

    // Seed probes data if table is empty
    const probeCount = await prisma.$queryRawUnsafe<{ count: number }[]>(`
      SELECT COUNT(*) as count FROM "${schemaName}"."probes";
    `);

    if (probeCount[0]?.count === 0) {
      const defaultProbes: { id: string; name: string; description: string }[] = JSON.parse(
        await fs.promises.readFile(path.join(__dirname, '../constant/json/probe.json'), 'utf8')
      );

      if (defaultProbes.length > 0) {
        await prisma.$executeRawUnsafe(`
          INSERT INTO "${schemaName}"."probes" (
            "id", "probe_id", "name", "description", "created_at", "updated_at"
          )
          VALUES
          ${defaultProbes
            .map(
              probe => `(
                '${uuidv4()}', '${probe.id}', '${probe.name}', '${probe.description || ''}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
              )`
            )
            .join(',')}
          ON CONFLICT("id") DO NOTHING;
        `);
      }
    }
  }

  /**
   * Migrate category-related tables
   */
  private static async migrateCategoryTables(schemaName: string): Promise<void> {
    // Create categories table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."categories" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "is_built_in" BOOLEAN NOT NULL DEFAULT false,
        "probes" TEXT[],
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
      );
    `);

    // Create probe_categories junction table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."probe_categories" (
        "probe_id" TEXT NOT NULL,
        "category_id" TEXT NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "probe_categories_pkey" PRIMARY KEY ("probe_id", "category_id")
      );
    `);

    // Add foreign key constraints for probe_categories junction table
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "${schemaName}"."probe_categories"
        ADD CONSTRAINT "probe_categories_probe_id_fkey"
        FOREIGN KEY ("probe_id") REFERENCES "${schemaName}"."probes"("probe_id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    } catch (_error) {
      // Constraint might already exist
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "${schemaName}"."probe_categories"
        ADD CONSTRAINT "probe_categories_category_id_fkey"
        FOREIGN KEY ("category_id") REFERENCES "${schemaName}"."categories"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    } catch (_error) {
      // Constraint might already exist
    }

    // Add indexes for better performance
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "probe_categories_probe_id_idx" ON "${schemaName}"."probe_categories"("probe_id");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "probe_categories_category_id_idx" ON "${schemaName}"."probe_categories"("category_id");
    `);

    // Seed categories data if table is empty
    const categoryCount = await prisma.$queryRawUnsafe<{ count: number }[]>(`
      SELECT COUNT(*) as count FROM "${schemaName}"."categories";
    `);

    if (categoryCount[0]?.count === 0) {
      const defaultCategories: {
        name: string;
        description: string;
        probes: string[];
      }[] = JSON.parse(
        await fs.promises.readFile(path.join(__dirname, '../constant/json/category.json'), 'utf8')
      );

      if (defaultCategories.length > 0) {
        await prisma.$executeRawUnsafe(`
          INSERT INTO "${schemaName}"."categories" (
            "id", "name", "description", "is_built_in", "probes", "created_at", "updated_at"
          )
          VALUES
          ${defaultCategories
            .map(
              category => `(
                '${uuidv4()}', '${category.name}', '${category.description}', true, ${
                  category.probes.length > 0
                    ? `ARRAY[${category.probes
                        .map(probe => `'${probe.replace(/\\/g, '\\\\').replace(/'/g, "''")}'`)
                        .join(',')}]`
                    : 'ARRAY[]::text[]'
                }, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
              )`
            )
            .join(',')}
          ON CONFLICT("id") DO NOTHING;
        `);

        // Populate probe_categories junction table with default relationships
        try {
          const junctionCount = await prisma.$queryRawUnsafe<{ count: number }[]>(`
            SELECT COUNT(*) as count FROM "${schemaName}"."probe_categories";
          `);

          if (junctionCount[0]?.count === 0) {
            for (const category of defaultCategories) {
              if (category.probes && category.probes.length > 0) {
                const categoryResult = await prisma.$queryRawUnsafe<{ id: string }[]>(`
                  SELECT id FROM "${schemaName}"."categories" WHERE "name" = '${category.name}' LIMIT 1;
                `);

                if (categoryResult.length > 0 && categoryResult[0]) {
                  const categoryId = categoryResult[0].id;
                  const junctionValues = category.probes
                    .map(
                      probeId =>
                        `('${probeId}', '${categoryId}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`
                    )
                    .join(', ');

                  if (junctionValues) {
                    await prisma.$executeRawUnsafe(`
                      INSERT INTO "${schemaName}"."probe_categories" ("probe_id", "category_id", "created_at", "updated_at")
                      VALUES ${junctionValues}
                      ON CONFLICT ("probe_id", "category_id") DO NOTHING;
                    `);
                  }
                }
              }
            }
          }
        } catch (error) {
          console.error(
            `❌ Failed to populate probe-category relationships for ${schemaName}:`,
            error
          );
          // Don't throw error here as the migration was successful
        }
      }
    }
  }

  /**
   * Migrate detector-related tables
   */
  private static async migrateDetectorTables(schemaName: string): Promise<void> {
    // Create detectors table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."detectors" (
        "id" TEXT NOT NULL,
        "detector_name" TEXT NOT NULL,
        "description" TEXT,
        "creation_type" "${schemaName}"."CreationType" NOT NULL,
        "detector_type" "${schemaName}"."DetectorType" NOT NULL,
        "confidence" DOUBLE PRECISION NOT NULL,
        "regex" TEXT[],
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "detectors_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "detectors_detector_name_key" ON "${schemaName}"."detectors"("detector_name");
    `);

    // Check if detectors table exists and has TEXT columns (for migration from old schema)
    const tableInfo = await prisma.$queryRawUnsafe<{ column_name: string; data_type: string }[]>(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = '${schemaName}'
      AND table_name = 'detectors'
      AND column_name IN ('creation_type', 'detector_type');
    `);

    // Convert TEXT columns to enum types if needed
    const creationTypeColumn = tableInfo.find(col => col.column_name === 'creation_type');
    const detectorTypeColumn = tableInfo.find(col => col.column_name === 'detector_type');

    if (creationTypeColumn && creationTypeColumn.data_type === 'text') {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "${schemaName}"."detectors"
        ALTER COLUMN "creation_type" TYPE "${schemaName}"."CreationType"
        USING "creation_type"::"${schemaName}"."CreationType";
      `);
    }

    if (detectorTypeColumn && detectorTypeColumn.data_type === 'text') {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "${schemaName}"."detectors"
        ALTER COLUMN "detector_type" TYPE "${schemaName}"."DetectorType"
        USING "detector_type"::"${schemaName}"."DetectorType";
      `);
    }

    // Seed detectors data if table is empty
    const detectorCount = await prisma.$queryRawUnsafe<{ count: number }[]>(`
      SELECT COUNT(*) as count FROM "${schemaName}"."detectors";
    `);

    if (detectorCount[0]?.count === 0) {
      const defaultDetectors: {
        detectorName: string;
        description: string;
        creationType: string;
        detectorType: string;
        confidence: number;
        regex: string[];
      }[] = JSON.parse(
        await fs.promises.readFile(path.join(__dirname, '../constant/json/detector.json'), 'utf8')
      );

      if (defaultDetectors.length > 0) {
        await prisma.$executeRawUnsafe(`
          INSERT INTO "${schemaName}"."detectors" (
            "id", "detector_name", "description", "creation_type", "detector_type", "confidence", "regex", "created_at", "updated_at"
          )
          VALUES
          ${defaultDetectors
            .map(
              detector => `(
                '${uuidv4()}', '${detector.detectorName}', '${detector.description}', '${detector.creationType}', '${detector.detectorType}', ${detector.confidence}, ARRAY[${detector.regex.map(r => `'${r.replace(/'/g, "''")}'`).join(',')}], CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
              )`
            )
            .join(',')}
          ON CONFLICT("detector_name") DO NOTHING;
        `);
      }
    }
  }

  /**
   * Migrate policy-related tables
   */
  private static async migratePolicyTables(schemaName: string): Promise<void> {
    // Create Type enum for policies
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TYPE "${schemaName}"."Type" AS ENUM ('RED', 'BLUE', 'AGENTIC');
      `);
    } catch (_error) {
      // Enum already exists
    }

    // Create policies table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."policies" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "type" TEXT NOT NULL,
        "default_detector" BOOLEAN NOT NULL DEFAULT true,

        "anonymize" BOOLEAN NOT NULL DEFAULT false,
        "anonymize_type" TEXT[] NOT NULL DEFAULT '{}',
        "anonymize_hidden_names" TEXT[] NOT NULL DEFAULT '{}',
        "anonymize_allowed_names" TEXT[] NOT NULL DEFAULT '{}',
        "anonymize_preamble" TEXT,
        "anonymize_use_faker" BOOLEAN NOT NULL DEFAULT false,
        "anonymize_threshold" DOUBLE PRECISION,

        "ban_code" BOOLEAN NOT NULL DEFAULT false,
        "ban_code_threshold" DOUBLE PRECISION,

        "ban_competitors" BOOLEAN NOT NULL DEFAULT false,
        "ban_competitors_threshold" DOUBLE PRECISION,
        "ban_competitors_competitors" TEXT[] NOT NULL DEFAULT '{}',

        "ban_substrings" BOOLEAN NOT NULL DEFAULT false,
        "ban_substrings_substrings" TEXT[] NOT NULL DEFAULT '{}',
        "ban_substrings_match_type" TEXT,
        "ban_substrings_case_sensitive" BOOLEAN NOT NULL DEFAULT false,
        "ban_substrings_redact" BOOLEAN NOT NULL DEFAULT false,
        "ban_substrings_contains_all" BOOLEAN NOT NULL DEFAULT false,

        "ban_topics" BOOLEAN NOT NULL DEFAULT false,
        "ban_topics_threshold" DOUBLE PRECISION,
        "ban_topics_topics" TEXT[] NOT NULL DEFAULT '{}',

        "code" BOOLEAN NOT NULL DEFAULT false,
        "code_languages" TEXT[] NOT NULL DEFAULT '{}',
        "code_is_blocked" BOOLEAN NOT NULL DEFAULT false,

        "gibberish" BOOLEAN NOT NULL DEFAULT false,
        "gibberish_threshold" DOUBLE PRECISION,
        "gibberish_match_type" TEXT,

        "language" BOOLEAN NOT NULL DEFAULT false,
        "language_valid_languages" TEXT[] NOT NULL DEFAULT '{}',
        "language_match_type" TEXT,

        "prompt_injection" BOOLEAN NOT NULL DEFAULT false,
        "prompt_injection_threshold" DOUBLE PRECISION,
        "prompt_injection_match_type" TEXT,

        "regex" BOOLEAN NOT NULL DEFAULT false,
        "regex_patterns" TEXT[] NOT NULL DEFAULT '{}',
        "regex_is_blocked" BOOLEAN NOT NULL DEFAULT false,
        "regex_redact" BOOLEAN NOT NULL DEFAULT false,

        "secrets" BOOLEAN NOT NULL DEFAULT false,
        "secrets_redact_mode" TEXT,

        "sentiment" BOOLEAN NOT NULL DEFAULT false,
        "sentiment_threshold" DOUBLE PRECISION,
        "sentiment_match_type" TEXT,

        "token_limit" BOOLEAN NOT NULL DEFAULT false,
        "token_limit_limit" INTEGER,
        "token_limit_encoding_name" TEXT,

        "toxicity" BOOLEAN NOT NULL DEFAULT false,
        "toxicity_threshold" DOUBLE PRECISION,
        "toxicity_match_type" TEXT,

        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "policies_name_key" ON "${schemaName}"."policies"("name");
    `);

    // Create junction tables for many-to-many relationships
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."_PolicyDetectors" (
        "A" TEXT NOT NULL,
        "B" TEXT NOT NULL,

        CONSTRAINT "_PolicyDetectors_AB_pkey" PRIMARY KEY ("A", "B")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "_PolicyDetectors_B_index" ON "${schemaName}"."_PolicyDetectors"("B");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."_PolicyCategories" (
        "A" TEXT NOT NULL,
        "B" TEXT NOT NULL,

        CONSTRAINT "_PolicyCategories_AB_pkey" PRIMARY KEY ("A", "B")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "_PolicyCategories_B_index" ON "${schemaName}"."_PolicyCategories"("B");
    `);

    // Seed policies data if table is empty
    const policyCount = await prisma.$queryRawUnsafe<{ count: number }[]>(`
      SELECT COUNT(*) as count FROM "${schemaName}"."policies";
    `);

    if (policyCount[0]?.count === 0) {
      const defaultPolicies: {
        name: string;
        description: string;
        defaultDetector: boolean;
        detectors: string[];
        categories: string[];
      }[] = JSON.parse(
        await fs.promises.readFile(path.join(__dirname, '../constant/json/policy.json'), 'utf8')
      );

      if (defaultPolicies.length > 0) {
        // Insert policies
        await prisma.$executeRawUnsafe(`
          INSERT INTO "${schemaName}"."policies" (
            "id", "name", "description", "default_detector", "created_at", "updated_at"
          )
          VALUES
          ${defaultPolicies
            .map(
              policy => `(
                '${uuidv4()}', '${policy.name}', '${policy.description}', ${policy.defaultDetector}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
              )`
            )
            .join(',')}
          ON CONFLICT("name") DO NOTHING;
        `);
      }
    }
  }

  /**
   * Migrate project-related tables
   */
  private static async migrateProjectTables(schemaName: string): Promise<void> {
    // Create projects table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."projects" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "type" "${schemaName}"."Type" NOT NULL,
        "policy_id" TEXT,
        "model_type" "${schemaName}"."RedModelType",
        "model_name" TEXT,
        "model_url" TEXT,
        "model_token" TEXT,
        "authorization_token" "${schemaName}"."RedAuthorizationType",
        "request_template" JSONB,
        "agentic_zip_url" TEXT,
        "blue_domain" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "projects_name_key" ON "${schemaName}"."projects"("name");
    `);

    // Check if table has all required columns and add missing ones
    try {
      const tableInfo = await prisma.$queryRawUnsafe<{ column_name: string; data_type: string }[]>(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = '${schemaName}'
        AND table_name = 'projects'
        AND column_name IN ('policy_id', 'blue_domain');
      `);

      const hasPolicy = tableInfo.some(col => col.column_name === 'policy_id');
      const hasBlueDomain = tableInfo.some(col => col.column_name === 'blue_domain');

      if (!hasPolicy || !hasBlueDomain) {
        const columnsToAdd = [];
        if (!hasPolicy) columnsToAdd.push('ADD COLUMN IF NOT EXISTS "policy_id" TEXT');
        if (!hasBlueDomain) columnsToAdd.push('ADD COLUMN IF NOT EXISTS "blue_domain" TEXT');

        await prisma.$executeRawUnsafe(`
          ALTER TABLE "${schemaName}"."projects"
          ${columnsToAdd.join(', ')};
        `);
      }
    } catch (_error) {
      // Add missing columns if they don't exist
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "${schemaName}"."projects"
          ADD COLUMN IF NOT EXISTS "policy_id" TEXT,
          ADD COLUMN IF NOT EXISTS "blue_domain" TEXT;
        `);
      } catch (_alterError) {
        // Columns might already exist
      }
    }

    // Check if type column uses old ProjectType enum and convert to Type enum
    try {
      const typeColumnInfo = await prisma.$queryRawUnsafe<
        { column_name: string; data_type: string; udt_name: string }[]
      >(`
        SELECT column_name, data_type, udt_name
        FROM information_schema.columns
        WHERE table_schema = '${schemaName}'
        AND table_name = 'projects'
        AND column_name = 'type';
      `);

      if (typeColumnInfo.length > 0) {
        const typeColumn = typeColumnInfo[0];
        console.log(`Current type column info:`, typeColumn);

        // If the column uses the old ProjectType enum, convert it to Type enum
        if (
          typeColumn &&
          (typeColumn.udt_name === 'ProjectType' || typeColumn.data_type === 'text')
        ) {
          console.log(`Converting type column from ${typeColumn.udt_name} to Type enum...`);

          try {
            // First, try to drop the old enum if it exists and is not being used elsewhere
            try {
              await prisma.$executeRawUnsafe(`
                DROP TYPE IF EXISTS "${schemaName}"."ProjectType" CASCADE;
              `);
            } catch (_dropError) {
              // Old enum might be in use, continue with conversion
            }

            // Convert the column to use the new Type enum
            await prisma.$executeRawUnsafe(`
              ALTER TABLE "${schemaName}"."projects"
              ALTER COLUMN "type" TYPE "${schemaName}"."Type"
              USING "type"::text::"${schemaName}"."Type";
            `);

            console.log(`✅ Successfully converted type column to Type enum`);
          } catch (enumError) {
            console.error(`❌ Failed to convert enum:`, enumError);

            // Fallback: Try to recreate the column with correct type
            try {
              await prisma.$executeRawUnsafe(`
                ALTER TABLE "${schemaName}"."projects"
                ADD COLUMN "type_new" "${schemaName}"."Type";
              `);

              await prisma.$executeRawUnsafe(`
                UPDATE "${schemaName}"."projects"
                SET "type_new" = "type"::text::"${schemaName}"."Type";
              `);

              await prisma.$executeRawUnsafe(`
                ALTER TABLE "${schemaName}"."projects"
                DROP COLUMN "type";
              `);

              await prisma.$executeRawUnsafe(`
                ALTER TABLE "${schemaName}"."projects"
                RENAME COLUMN "type_new" TO "type";
              `);

              await prisma.$executeRawUnsafe(`
                ALTER TABLE "${schemaName}"."projects"
                ALTER COLUMN "type" SET NOT NULL;
              `);

              console.log(`✅ Successfully recreated type column with Type enum`);
            } catch (fallbackError) {
              console.error(`❌ Fallback enum conversion also failed:`, fallbackError);
            }
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error checking/converting type column:`, error);
    }

    // Add foreign key constraint for policy relationship
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "${schemaName}"."projects"
        ADD CONSTRAINT "projects_policy_id_fkey"
        FOREIGN KEY ("policy_id") REFERENCES "${schemaName}"."policies"("id")
        ON DELETE SET NULL ON UPDATE CASCADE;
      `);
    } catch (_error) {
      // Constraint might already exist
    }

    // Seed projects data if table is empty
    const projectCount = await prisma.$queryRawUnsafe<{ count: number }[]>(`
      SELECT COUNT(*) as count FROM "${schemaName}"."projects";
    `);

    if (projectCount[0]?.count === 0) {
      const defaultProjects: {
        name: string;
        description: string;
        type: string;
      }[] = JSON.parse(
        await fs.promises.readFile(path.join(__dirname, '../constant/json/project.json'), 'utf8')
      );

      if (defaultProjects.length > 0) {
        await prisma.$executeRawUnsafe(`
          INSERT INTO "${schemaName}"."projects" (
            "id", "name", "description", "type", "created_at", "updated_at"
          )
          VALUES
          ${defaultProjects
            .map(
              project => `(
                '${uuidv4()}', '${project.name}', '${project.description}', '${project.type}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
              )`
            )
            .join(',')}
          ON CONFLICT("name") DO NOTHING;
        `);
      }
    }

    console.log(`✅ Project tables migrated for schema: ${schemaName}`);
  }

  /**
   * Migrate job-related tables
   */
  private static async migrateJobTables(schemaName: string): Promise<void> {
    // Create jobs table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."jobs" (
        "id" TEXT NOT NULL,
        "project_id" TEXT NOT NULL,
        "project_type" "${schemaName}"."Type" NOT NULL,
        "status" "${schemaName}"."JobStatus" NOT NULL,
        "authorization_key" TEXT,
        "evaluation_threshold" DOUBLE PRECISION,
        "agentic_report" TEXT,
        "blue_api_key" TEXT,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
      );
    `);

    // Add foreign key constraint
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "${schemaName}"."jobs"
        ADD CONSTRAINT "jobs_project_id_fkey"
        FOREIGN KEY ("project_id") REFERENCES "${schemaName}"."projects"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    } catch (_error) {
      // Constraint might already exist
    }

    // Check if table has all required columns and add missing ones
    try {
      await prisma.$executeRawUnsafe(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = '${schemaName}'
        AND table_name = 'jobs'
        AND column_name IN ('agentic_report', 'blue_api_key');
      `);
    } catch (_error) {
      // Add missing columns if they don't exist
      try {
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "${schemaName}"."jobs"
          ADD COLUMN IF NOT EXISTS "agentic_report" TEXT,
          ADD COLUMN IF NOT EXISTS "blue_api_key" TEXT;
        `);
      } catch (_alterError) {
        // Columns might already exist
      }
    }

    console.warn(`✅ Job tables migrated for schema: ${schemaName}`);

    await this.migrateBlueTeamLogTables(schemaName);
  }

  /**
   * Migrate blue team log table
   */
  private static async migrateBlueTeamLogTables(schemaName: string): Promise<void> {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "${schemaName}"."blueteam_logs" (
        "id" TEXT NOT NULL,
        "job_id" TEXT NOT NULL,
        "project_id" TEXT NOT NULL,
        "policy_id" TEXT NOT NULL,
        "policy_name" TEXT NOT NULL,
        "user_prompt" TEXT NOT NULL,
        "sanitized_content" TEXT NOT NULL,
        "status" TEXT NOT NULL,
        "is_fail" BOOLEAN NOT NULL,
        "scanners_used" TEXT[] NOT NULL,
        "scan_results" JSONB NOT NULL,
        "risk_scores" JSONB NOT NULL,
        "failed_scanners" TEXT[] NOT NULL,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "blueteam_logs_pkey" PRIMARY KEY ("id")
      );
    `);

    // Add indexes similar to global schema
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "blueteam_logs_job_id_idx" ON "${schemaName}"."blueteam_logs"("job_id");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "blueteam_logs_project_id_idx" ON "${schemaName}"."blueteam_logs"("project_id");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "blueteam_logs_created_at_idx" ON "${schemaName}"."blueteam_logs"("created_at");
    `);

    // Add foreign key constraints
    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "${schemaName}"."blueteam_logs"
        ADD CONSTRAINT "blueteam_logs_job_id_fkey"
        FOREIGN KEY ("job_id") REFERENCES "${schemaName}"."jobs"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    } catch (_error) {
      // Constraint might already exist
    }

    try {
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "${schemaName}"."blueteam_logs"
        ADD CONSTRAINT "blueteam_logs_project_id_fkey"
        FOREIGN KEY ("project_id") REFERENCES "${schemaName}"."projects"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
      `);
    } catch (_error) {
      // Constraint might already exist
    }
  }

  /**
   * Check if a tenant schema exists
   * @param tenantId - The tenant identifier
   * @returns True if schema exists, false otherwise
   */
  public static async tenantSchemaExists(tenantId: string): Promise<boolean> {
    const schemaName = `tenant_${tenantId}_schema`;

    try {
      const result = await prisma.$queryRawUnsafe<{ exists: boolean }[]>(`
        SELECT EXISTS(
          SELECT 1 FROM information_schema.schemata
          WHERE schema_name = '${schemaName}'
        ) as exists;
      `);

      return result[0]?.exists || false;
    } catch (error) {
      console.error(`❌ Failed to check tenant schema existence: ${schemaName}`, error);
      return false;
    }
  }

  /**
   * Delete a tenant schema and all its data
   * @param tenantId - The tenant identifier
   */
  public static async deleteTenantSchema(tenantId: string): Promise<void> {
    const schemaName = `tenant_${tenantId}_schema`;

    try {
      // First disconnect the tenant client if it exists
      if (this.clients.has(tenantId)) {
        const client = this.clients.get(tenantId);
        await client?.$disconnect();
        this.clients.delete(tenantId);
      }

      // Check if schema exists before attempting to delete
      const schemaExists = await this.tenantSchemaExists(tenantId);
      if (!schemaExists) {
        console.warn(`⚠️ Tenant schema does not exist: ${schemaName}`);
        return;
      }

      // Drop the entire schema (CASCADE will remove all tables and data)
      await prisma.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);

      // eslint-disable-next-line no-console
      console.log(`✅ Tenant schema deleted successfully: ${schemaName}`);
    } catch (error) {
      console.error(`❌ Failed to delete tenant schema: ${schemaName}`, error);
      throw error;
    }
  }

  /**
   * Close all tenant connections
   */
  public static async disconnectAll(): Promise<void> {
    const disconnectPromises = Array.from(this.clients.values()).map(client =>
      client.$disconnect()
    );

    await Promise.all(disconnectPromises);
    this.clients.clear();
  }
}

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
  await TenantPrismaClient.disconnectAll();
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  await TenantPrismaClient.disconnectAll();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  await TenantPrismaClient.disconnectAll();
  process.exit(0);
});
