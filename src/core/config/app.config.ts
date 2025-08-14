/**
 * Application Configuration
 * Type-safe configuration management with validation
 */

import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';
import { Environment, IBaseConfig, LogLevel } from '../common/types';

// Configuration Interface
export interface IAppConfig extends IBaseConfig {
  readonly port: number;
  readonly host: string;
  readonly baseUrl: string;
  readonly timezone: string;
  readonly cors: ICorsConfig;
  readonly rateLimit: IRateLimitConfig;
  readonly security: ISecurityConfig;
  readonly logging: ILoggingConfig;
  readonly performance: IPerformanceConfig;
}

export interface ICorsConfig {
  readonly enabled: boolean;
  readonly origins: string[];
  readonly credentials: boolean;
  readonly methods: string[];
  readonly allowedHeaders: string[];
  readonly exposedHeaders: string[];
  readonly maxAge: number;
}

export interface IRateLimitConfig {
  readonly windowMs: number;
  readonly max: number;
  readonly skipSuccessfulRequests: boolean;
  readonly skipFailedRequests: boolean;
  readonly keyGenerator: string;
  readonly message: string;
}

export interface ISecurityConfig {
  readonly jwtSecret: string;
  readonly jwtExpiresIn: string;
  readonly bcryptRounds: number;
  readonly apiKey: string;
  readonly enableHelmet: boolean;
  readonly enableCsrf: boolean;
  readonly sessionSecret: string;
  readonly maxLoginAttempts: number;
  readonly lockoutDuration: number;
}

export interface ILoggingConfig {
  readonly level: LogLevel;
  readonly format: string;
  readonly enableConsole: boolean;
  readonly enableFile: boolean;
  readonly filePath: string;
  readonly maxFiles: number;
  readonly maxSize: string;
  readonly enableRotation: boolean;
  readonly enableJson: boolean;
}

export interface IPerformanceConfig {
  readonly enableCompression: boolean;
  readonly compressionLevel: number;
  readonly enableCaching: boolean;
  readonly cacheTtl: number;
  readonly maxRequestSize: string;
  readonly requestTimeout: number;
  readonly enableMetrics: boolean;
}

// Validation Schema
export const appConfigSchema = Joi.object({
  name: Joi.string().required().min(1).max(100),
  version: Joi.string().required().pattern(/^\d+\.\d+\.\d+$/),
  environment: Joi.string().valid(...Object.values(Environment)).required(),
  debug: Joi.boolean().default(false),
  port: Joi.number().port().required(),
  host: Joi.string().ip().default('0.0.0.0'),
  baseUrl: Joi.string().uri().required(),
  timezone: Joi.string().required(),
  
  cors: Joi.object({
    enabled: Joi.boolean().default(true),
    origins: Joi.array().items(Joi.string()).default(['*']),
    credentials: Joi.boolean().default(false),
    methods: Joi.array().items(Joi.string()).default(['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']),
    allowedHeaders: Joi.array().items(Joi.string()).default(['Content-Type', 'Authorization', 'X-API-Key']),
    exposedHeaders: Joi.array().items(Joi.string()).default([]),
    maxAge: Joi.number().positive().default(86400)
  }).required(),
  
  rateLimit: Joi.object({
    windowMs: Joi.number().positive().default(900000), // 15 minutes
    max: Joi.number().positive().default(100),
    skipSuccessfulRequests: Joi.boolean().default(false),
    skipFailedRequests: Joi.boolean().default(false),
    keyGenerator: Joi.string().valid('ip', 'user', 'api-key').default('ip'),
    message: Joi.string().default('Too many requests from this IP, please try again later.')
  }).required(),
  
  security: Joi.object({
    jwtSecret: Joi.string().min(32).required(),
    jwtExpiresIn: Joi.string().default('24h'),
    bcryptRounds: Joi.number().min(10).max(15).default(12),
    apiKey: Joi.string().min(16).required(),
    enableHelmet: Joi.boolean().default(true),
    enableCsrf: Joi.boolean().default(false),
    sessionSecret: Joi.string().min(32).required(),
    maxLoginAttempts: Joi.number().positive().default(5),
    lockoutDuration: Joi.number().positive().default(900000) // 15 minutes
  }).required(),
  
  logging: Joi.object({
    level: Joi.string().valid(...Object.values(LogLevel)).default(LogLevel.INFO),
    format: Joi.string().valid('json', 'simple', 'combined').default('json'),
    enableConsole: Joi.boolean().default(true),
    enableFile: Joi.boolean().default(false),
    filePath: Joi.string().default('./logs/app.log'),
    maxFiles: Joi.number().positive().default(5),
    maxSize: Joi.string().default('10m'),
    enableRotation: Joi.boolean().default(true),
    enableJson: Joi.boolean().default(true)
  }).required(),
  
  performance: Joi.object({
    enableCompression: Joi.boolean().default(true),
    compressionLevel: Joi.number().min(1).max(9).default(6),
    enableCaching: Joi.boolean().default(true),
    cacheTtl: Joi.number().positive().default(3600),
    maxRequestSize: Joi.string().default('10mb'),
    requestTimeout: Joi.number().positive().default(30000),
    enableMetrics: Joi.boolean().default(true)
  }).required()
});

// Helper functions for safe parsing
const safeParseInt = (value: string | undefined, defaultValue: number): number => {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

const safeParseFloat = (value: string | undefined, defaultValue: number): number => {
  if (!value) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
};

const parseBoolean = (value: string | undefined, defaultValue: boolean): boolean => {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
};

const parseArray = (value: string | undefined, defaultValue: string[]): string[] => {
  if (!value) return defaultValue;
  return value.split(',').map(item => item.trim()).filter(item => item.length > 0);
};

// Configuration Factory
export const appConfig = registerAs('app', (): IAppConfig => {
  const config: IAppConfig = {
    name: process.env.APP_NAME || 'Executive Assistant AI',
    version: process.env.APP_VERSION || '1.0.0',
    environment: (process.env.NODE_ENV as Environment) || Environment.DEVELOPMENT,
    debug: parseBoolean(process.env.DEBUG, false),
    port: safeParseInt(process.env.PORT, 3000),
    host: process.env.HOST || '0.0.0.0',
    baseUrl: process.env.BASE_URL || 'http://localhost:3000',
    timezone: process.env.DEFAULT_TIMEZONE || 'America/New_York',
    
    cors: {
      enabled: parseBoolean(process.env.CORS_ENABLED, true),
      origins: parseArray(process.env.CORS_ORIGINS, ['*']),
      credentials: parseBoolean(process.env.CORS_CREDENTIALS, false),
      methods: parseArray(process.env.CORS_METHODS, ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']),
      allowedHeaders: parseArray(process.env.CORS_ALLOWED_HEADERS, ['Content-Type', 'Authorization', 'X-API-Key']),
      exposedHeaders: parseArray(process.env.CORS_EXPOSED_HEADERS, []),
      maxAge: safeParseInt(process.env.CORS_MAX_AGE, 86400)
    },
    
    rateLimit: {
      windowMs: safeParseInt(process.env.RATE_LIMIT_WINDOW_MS, 900000),
      max: safeParseInt(process.env.RATE_LIMIT_MAX, 100),
      skipSuccessfulRequests: parseBoolean(process.env.RATE_LIMIT_SKIP_SUCCESS, false),
      skipFailedRequests: parseBoolean(process.env.RATE_LIMIT_SKIP_FAILED, false),
      keyGenerator: process.env.RATE_LIMIT_KEY_GENERATOR || 'ip',
      message: process.env.RATE_LIMIT_MESSAGE || 'Too many requests from this IP, please try again later.'
    },
    
    security: {
      jwtSecret: process.env.JWT_SECRET || 'dev_jwt_secret_change_in_production',
      jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
      bcryptRounds: safeParseInt(process.env.BCRYPT_ROUNDS, 12),
      apiKey: process.env.API_KEY || 'dev_api_key_change_in_production',
      enableHelmet: parseBoolean(process.env.SECURITY_HELMET, true),
      enableCsrf: parseBoolean(process.env.SECURITY_CSRF, false),
      sessionSecret: process.env.SESSION_SECRET || 'dev_session_secret_change_in_production',
      maxLoginAttempts: safeParseInt(process.env.MAX_LOGIN_ATTEMPTS, 5),
      lockoutDuration: safeParseInt(process.env.LOCKOUT_DURATION, 900000)
    },
    
    logging: {
      level: (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO,
      format: process.env.LOG_FORMAT || 'json',
      enableConsole: parseBoolean(process.env.LOG_CONSOLE, true),
      enableFile: parseBoolean(process.env.LOG_FILE, false),
      filePath: process.env.LOG_FILE_PATH || './logs/app.log',
      maxFiles: safeParseInt(process.env.LOG_MAX_FILES, 5),
      maxSize: process.env.LOG_MAX_SIZE || '10m',
      enableRotation: parseBoolean(process.env.LOG_ROTATION, true),
      enableJson: parseBoolean(process.env.LOG_JSON, true)
    },
    
    performance: {
      enableCompression: parseBoolean(process.env.COMPRESSION_ENABLED, true),
      compressionLevel: safeParseInt(process.env.COMPRESSION_LEVEL, 6),
      enableCaching: parseBoolean(process.env.CACHING_ENABLED, true),
      cacheTtl: safeParseInt(process.env.CACHE_TTL, 3600),
      maxRequestSize: process.env.MAX_REQUEST_SIZE || '10mb',
      requestTimeout: safeParseInt(process.env.REQUEST_TIMEOUT, 30000),
      enableMetrics: parseBoolean(process.env.ENABLE_METRICS, true)
    }
  };

  // Validate configuration
  const { error, value } = appConfigSchema.validate(config, { 
    abortEarly: false,
    allowUnknown: false 
  });

  if (error) {
    throw new Error(`Application configuration validation failed: ${error.message}`);
  }

  return value;
});

// Configuration validation function
export function validateAppConfig(config: any): IAppConfig {
  const { error, value } = appConfigSchema.validate(config, { 
    abortEarly: false,
    allowUnknown: false 
  });

  if (error) {
    throw new Error(`Application configuration validation failed: ${error.message}`);
  }

  return value;
}

// Environment-specific configuration overrides
export function getEnvironmentConfig(environment: Environment): Partial<IAppConfig> {
  switch (environment) {
    case Environment.DEVELOPMENT:
      return {
        debug: true,
        logging: {
          level: LogLevel.DEBUG,
          format: 'simple',
          enableConsole: true,
          enableFile: false,
          filePath: './logs/dev.log',
          maxFiles: 3,
          maxSize: '5m',
          enableRotation: false,
          enableJson: false
        },
        security: {
          jwtSecret: 'dev_jwt_secret',
          jwtExpiresIn: '7d',
          bcryptRounds: 10,
          apiKey: 'dev_api_key',
          enableHelmet: false,
          enableCsrf: false,
          sessionSecret: 'dev_session_secret',
          maxLoginAttempts: 10,
          lockoutDuration: 300000
        }
      };
      
    case Environment.STAGING:
      return {
        debug: false,
        logging: {
          level: LogLevel.INFO,
          format: 'json',
          enableConsole: true,
          enableFile: true,
          filePath: './logs/staging.log',
          maxFiles: 5,
          maxSize: '10m',
          enableRotation: true,
          enableJson: true
        }
      };
      
    case Environment.PRODUCTION:
      return {
        debug: false,
        logging: {
          level: LogLevel.WARN,
          format: 'json',
          enableConsole: false,
          enableFile: true,
          filePath: './logs/production.log',
          maxFiles: 10,
          maxSize: '50m',
          enableRotation: true,
          enableJson: true
        },
        performance: {
          enableCompression: true,
          compressionLevel: 9,
          enableCaching: true,
          cacheTtl: 7200,
          maxRequestSize: '5mb',
          requestTimeout: 15000,
          enableMetrics: true
        }
      };
      
    default:
      return {};
  }
}
