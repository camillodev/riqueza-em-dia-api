import { registerAs } from '@nestjs/config';
import { z } from 'zod';

// Schema for validating environment variables
const envSchema = z.object({
  // General
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  // Database
  DATABASE_URL: z.string().url(),

  // Auth
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('1h'),
  JWT_REFRESH_SECRET: z.string().min(32).optional(),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Rate limiting
  THROTTLE_TTL: z.coerce.number().default(60),
  THROTTLE_LIMIT: z.coerce.number().default(100),

  // CORS
  CORS_ORIGINS: z.string().default('*'),

  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'log', 'debug', 'verbose']).default('log'),

  // Cache
  CACHE_TTL: z.coerce.number().default(300),
});

// Validate and export a type-safe config object
const validateEnv = (): z.infer<typeof envSchema> => {
  const env = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    DATABASE_URL: process.env.DATABASE_URL,
    JWT_SECRET: process.env.JWT_SECRET,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN,
    THROTTLE_TTL: process.env.THROTTLE_TTL,
    THROTTLE_LIMIT: process.env.THROTTLE_LIMIT,
    CORS_ORIGINS: process.env.CORS_ORIGINS,
    LOG_LEVEL: process.env.LOG_LEVEL,
    CACHE_TTL: process.env.CACHE_TTL,
  };

  try {
    return envSchema.parse(env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = `Environment validation error: ${error.errors.map(
        e => `${e.path}: ${e.message}`
      ).join(', ')}`;
      throw new Error(errorMessage);
    }
    throw error;
  }
};

// Register configuration to be used with ConfigService
export default registerAs('app', () => {
  const env = validateEnv();

  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    database: {
      url: env.DATABASE_URL,
    },
    jwt: {
      secret: env.JWT_SECRET,
      expiresIn: env.JWT_EXPIRES_IN,
      refreshSecret: env.JWT_REFRESH_SECRET || env.JWT_SECRET + '_refresh',
      refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
    },
    throttle: {
      ttl: env.THROTTLE_TTL,
      limit: env.THROTTLE_LIMIT,
    },
    cors: {
      origins: env.CORS_ORIGINS.split(',').map(origin => origin.trim()),
    },
    logging: {
      level: env.LOG_LEVEL,
    },
    cache: {
      ttl: env.CACHE_TTL * 1000, // Convert to milliseconds
    },
    isProd: env.NODE_ENV === 'production',
    isDev: env.NODE_ENV === 'development',
    isTest: env.NODE_ENV === 'test',
  };
}); 