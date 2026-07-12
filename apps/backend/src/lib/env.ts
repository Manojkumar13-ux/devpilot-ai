import { z } from 'zod';
import dotenv from 'dotenv';
import { logger } from './logger.js';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Server
  PORT: z.coerce.number().int().positive().default(4000),
  BACKEND_PORT: z.coerce.number().int().positive().default(4000),
  FRONTEND_URL: z.string().url().default('http://localhost:5173'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Auth (CRITICAL — no default)
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),

  // Database
  DATABASE_URL: z.string().url().default('postgresql://devpilot:devpilot@localhost:5432/devpilot'),

  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_PASSWORD: z.string().optional(),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // AI Provider
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MODEL: z.string().default('llama3.2:3b'),
  OPENAI_BASE_URL: z.string().default('http://localhost:11434/v1'),
  AI_PROVIDER: z.enum(['openai', 'claude', 'ollama']).default('ollama'),
  ANTHROPIC_API_KEY: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

let env: Env;

export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const errors = result.error.errors
      .map(e => `  - ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    logger.fatal(`Environment validation failed:\n${errors}`);
    if (result.error.errors.some(e => e.path.includes('JWT_SECRET'))) {
      logger.fatal('JWT_SECRET is required. Generate one with: openssl rand -hex 64');
    }
    process.exit(1);
  }
  env = result.data;
  return env;
}

export function getEnv(): Env {
  if (!env) return validateEnv();
  return env;
}
