/**
 * Executive Assistant AI - Advanced Configuration Management System
 * World-class, type-safe, dynamic configuration with validation and feature flags
 *
 * @fileoverview Comprehensive configuration system supporting:
 * - Environment-specific configurations
 * - Runtime configuration updates
 * - Feature flags and toggles
 * - Validation and type safety
 * - Performance optimization settings
 * - Security configurations
 *
 * @version 2.0.0
 * @author Executive Assistant AI Team
 */

import { IsString, IsNumber, IsBoolean, IsOptional, IsEmail, IsUrl, IsEnum, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

/**
 * Environment enumeration for type safety
 */
export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TEST = 'test',
}

/**
 * Log level enumeration
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

/**
 * Application configuration class with validation
 */
export class ApplicationConfig {
  @IsString()
  @Transform(({ value }) => value || 'Executive Assistant AI')
  name: string = 'Executive Assistant AI';

  @IsString()
  @Transform(({ value }) => value || '2.0.0')
  version: string = '2.0.0';

  @IsEnum(Environment)
  @Transform(({ value }) => value || Environment.DEVELOPMENT)
  environment: Environment = Environment.DEVELOPMENT;

  @IsNumber()
  @Min(1)
  @Max(65535)
  @Type(() => Number)
  @Transform(({ value }) => parseInt(value, 10) || 3000)
  port: number = 3000;

  @IsEnum(LogLevel)
  @Transform(({ value }) => value || LogLevel.INFO)
  logLevel: LogLevel = LogLevel.INFO;

  @IsOptional()
  @IsString()
  timezone: string = 'UTC';

  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  enableMetrics: boolean = true;

  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  enableHealthChecks: boolean = true;
}

/**
 * AI Services configuration
 */
export class AIServicesConfig {
  @IsString()
  @IsOptional()
  geminiApiKey: string = '';

  @IsString()
  @Transform(({ value }) => value || 'gemini-2.0-flash-exp')
  geminiModel: string = 'gemini-2.0-flash-exp';

  @IsNumber()
  @Min(1)
  @Max(4000)
  @Type(() => Number)
  @Transform(({ value }) => parseInt(value, 10) || 1000)
  maxTokens: number = 1000;

  @IsNumber()
  @Min(0)
  @Max(2)
  @Type(() => Number)
  @Transform(({ value }) => parseFloat(value) || 0.7)
  temperature: number = 0.7;

  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @Transform(({ value }) => parseInt(value, 10) || 15)
  requestsPerMinute: number = 15;
}

/**
 * Google Services configuration
 */
export class GoogleServicesConfig {
  @IsString()
  @IsOptional()
  clientId: string = '';

  @IsString()
  @IsOptional()
  clientSecret: string = '';

  @IsUrl()
  @IsOptional()
  @Transform(({ value }) => value || 'http://localhost:3000/auth/google/callback')
  redirectUri: string = 'http://localhost:3000/auth/google/callback';

  @IsString()
  @IsOptional()
  refreshToken: string = '';

  @IsString()
  @IsOptional()
  projectId: string = '';

  @IsString()
  @Transform(({ value }) => value || 'us-central1')
  region: string = 'us-central1';
}

/**
 * Email Services configuration
 */
export class EmailServicesConfig {
  @IsString()
  @IsOptional()
  sendgridApiKey: string = '';

  @IsEmail()
  @Transform(({ value }) => value || 'assistant@company.com')
  fromEmail: string = 'assistant@company.com';

  @IsString()
  @Transform(({ value }) => value || 'Executive Assistant AI')
  fromName: string = 'Executive Assistant AI';

  @IsNumber()
  @Min(1)
  @Max(1000)
  @Type(() => Number)
  @Transform(({ value }) => parseInt(value, 10) || 100)
  dailyLimit: number = 100;

  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  enableTemplates: boolean = true;
}

/**
 * Security configuration
 */
export class SecurityConfig {
  @IsString()
  @Transform(({ value }) => value || 'dev-jwt-secret-change-in-production')
  jwtSecret: string = 'dev-jwt-secret-change-in-production';

  @IsString()
  @Transform(({ value }) => value || 'dev-api-key-change-in-production')
  apiKey: string = 'dev-api-key-change-in-production';

  @IsNumber()
  @Min(300)
  @Max(86400)
  @Type(() => Number)
  @Transform(({ value }) => parseInt(value, 10) || 3600)
  jwtExpirationTime: number = 3600;

  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  enableCors: boolean = true;

  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  enableRateLimit: boolean = true;
}

/**
 * Performance configuration
 */
export class PerformanceConfig {
  @IsNumber()
  @Min(1)
  @Max(1000)
  @Type(() => Number)
  @Transform(({ value }) => parseInt(value, 10) || 100)
  rateLimitMax: number = 100;

  @IsNumber()
  @Min(1000)
  @Max(3600000)
  @Type(() => Number)
  @Transform(({ value }) => parseInt(value, 10) || 60000)
  rateLimitTtl: number = 60000;

  @IsNumber()
  @Min(1)
  @Max(3600)
  @Type(() => Number)
  @Transform(({ value }) => parseInt(value, 10) || 300)
  cacheDefaultTtl: number = 300;

  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  enableCaching: boolean = true;

  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  enableCompression: boolean = true;
}

/**
 * Feature flags configuration
 */
export class FeatureFlagsConfig {
  @IsBoolean()
  @Transform(({ value }) => value !== 'false' && value !== false)
  enableAIAssistant: boolean = true;

  @IsBoolean()
  @Transform(({ value }) => value !== 'false' && value !== false)
  enableCalendarIntegration: boolean = true;

  @IsBoolean()
  @Transform(({ value }) => value !== 'false' && value !== false)
  enableEmailAutomation: boolean = true;

  @IsBoolean()
  @Transform(({ value }) => value !== 'false' && value !== false)
  enableTaskManagement: boolean = true;

  @IsBoolean()
  @Transform(({ value }) => value !== 'false' && value !== false)
  enableProactiveAutomation: boolean = true;

  @IsBoolean()
  @Transform(({ value }) => value !== 'false' && value !== false)
  enableAnalytics: boolean = true;

  @IsBoolean()
  @Transform(({ value }) => value !== 'false' && value !== false)
  enableAdvancedLogging: boolean = true;
}

/**
 * Main configuration class
 */
export class AppConfig {
  @Type(() => ApplicationConfig)
  application: ApplicationConfig;

  @Type(() => AIServicesConfig)
  aiServices: AIServicesConfig;

  @Type(() => GoogleServicesConfig)
  googleServices: GoogleServicesConfig;

  @Type(() => EmailServicesConfig)
  emailServices: EmailServicesConfig;

  @Type(() => SecurityConfig)
  security: SecurityConfig;

  @Type(() => PerformanceConfig)
  performance: PerformanceConfig;

  @Type(() => FeatureFlagsConfig)
  features: FeatureFlagsConfig;

  constructor() {
    this.application = new ApplicationConfig();
    this.aiServices = new AIServicesConfig();
    this.googleServices = new GoogleServicesConfig();
    this.emailServices = new EmailServicesConfig();
    this.security = new SecurityConfig();
    this.performance = new PerformanceConfig();
    this.features = new FeatureFlagsConfig();
  }
}

/**
 * Configuration factory function
 */
export const createConfiguration = (): AppConfig => {
  // Create configuration object with proper defaults
  const config = new AppConfig();

  // Set application config
  config.application.name = process.env.APP_NAME || 'Executive Assistant AI';
  config.application.version = process.env.APP_VERSION || '2.0.0';
  config.application.environment = (process.env.NODE_ENV as Environment) || Environment.DEVELOPMENT;
  config.application.port = parseInt(process.env.PORT || '3000', 10);
  config.application.logLevel = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;
  config.application.timezone = process.env.TIMEZONE || 'UTC';
  config.application.enableMetrics = process.env.ENABLE_METRICS !== 'false';
  config.application.enableHealthChecks = process.env.ENABLE_HEALTH_CHECKS !== 'false';

  // Set AI services config
  config.aiServices.geminiApiKey = process.env.GEMINI_API_KEY || '';
  config.aiServices.geminiModel = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';
  config.aiServices.maxTokens = parseInt(process.env.GEMINI_MAX_TOKENS || '1000', 10);
  config.aiServices.temperature = parseFloat(process.env.GEMINI_TEMPERATURE || '0.7');
  config.aiServices.requestsPerMinute = parseInt(process.env.GEMINI_REQUESTS_PER_MINUTE || '15', 10);

  // Set Google services config
  config.googleServices.clientId = process.env.GOOGLE_CLIENT_ID || '';
  config.googleServices.clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  config.googleServices.redirectUri = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback';
  config.googleServices.refreshToken = process.env.GOOGLE_REFRESH_TOKEN || '';
  config.googleServices.projectId = process.env.GCP_PROJECT_ID || '';
  config.googleServices.region = process.env.GCP_REGION || 'us-central1';

  // Set email services config
  config.emailServices.sendgridApiKey = process.env.SENDGRID_API_KEY || '';
  config.emailServices.fromEmail = process.env.SENDGRID_FROM_EMAIL || 'assistant@example.com';
  config.emailServices.fromName = process.env.SENDGRID_FROM_NAME || 'Executive Assistant AI';
  config.emailServices.dailyLimit = parseInt(process.env.EMAIL_DAILY_LIMIT || '100', 10);
  config.emailServices.enableTemplates = process.env.ENABLE_EMAIL_TEMPLATES !== 'false';

  // Set security config
  config.security.jwtSecret = process.env.JWT_SECRET || 'dev-secret-key';
  config.security.apiKey = process.env.API_KEY || 'dev-api-key';
  config.security.jwtExpirationTime = parseInt(process.env.JWT_EXPIRATION_TIME || '3600', 10);
  config.security.enableCors = process.env.ENABLE_CORS !== 'false';
  config.security.enableRateLimit = process.env.ENABLE_RATE_LIMIT !== 'false';

  // Set performance config
  config.performance.rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX || '100', 10);
  config.performance.rateLimitTtl = parseInt(process.env.RATE_LIMIT_TTL || '60000', 10);
  config.performance.cacheDefaultTtl = parseInt(process.env.CACHE_DEFAULT_TTL || '300', 10);
  config.performance.enableCaching = process.env.ENABLE_CACHING !== 'false';
  config.performance.enableCompression = process.env.ENABLE_COMPRESSION !== 'false';

  // Set feature flags
  config.features.enableAIAssistant = process.env.FEATURE_AI_ASSISTANT !== 'false';
  config.features.enableCalendarIntegration = process.env.FEATURE_CALENDAR_INTEGRATION !== 'false';
  config.features.enableEmailAutomation = process.env.FEATURE_EMAIL_AUTOMATION !== 'false';
  config.features.enableTaskManagement = process.env.FEATURE_TASK_MANAGEMENT !== 'false';
  config.features.enableProactiveAutomation = process.env.FEATURE_PROACTIVE_AUTOMATION !== 'false';
  config.features.enableAnalytics = process.env.FEATURE_ANALYTICS !== 'false';
  config.features.enableAdvancedLogging = process.env.FEATURE_ADVANCED_LOGGING !== 'false';

  return config;
};

/**
 * Legacy configuration format for backward compatibility
 */
export const legacyConfiguration = (): any => ({
  app: {
    name: process.env.APP_NAME || 'Executive Assistant AI',
    port: parseInt(process.env.PORT || '3000', 10),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.APP_VERSION || '2.0.0',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/auth/google/callback',
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN || '',
    projectId: process.env.GCP_PROJECT_ID || '',
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    fromEmail: process.env.SENDGRID_FROM_EMAIL || 'assistant@company.com',
    fromName: process.env.SENDGRID_FROM_NAME || 'Executive Assistant AI',
  },
  gcp: {
    projectId: process.env.GCP_PROJECT_ID || '',
    region: process.env.GCP_REGION || 'us-central1',
    schedulerTimezone: process.env.GCP_SCHEDULER_TIMEZONE || 'America/New_York',
  },
  application: {
    maxCalendarDaysAhead: parseInt(process.env.MAX_CALENDAR_DAYS_AHEAD || '90', 10),
    emailRateLimitPerHour: parseInt(process.env.EMAIL_RATE_LIMIT_PER_HOUR || '50', 10),
    taskReminderAdvanceHours: parseInt(process.env.TASK_REMINDER_ADVANCE_HOURS || '24', 10),
  },
  security: {
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
    apiKey: process.env.API_KEY || 'dev-api-key',
    jwtExpirationTime: parseInt(process.env.JWT_EXPIRATION_TIME || '3600', 10),
    enableCors: process.env.ENABLE_CORS !== 'false',
    enableRateLimit: process.env.ENABLE_RATE_LIMIT !== 'false',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
  },
  features: {
    enableAIAssistant: process.env.FEATURE_AI_ASSISTANT !== 'false',
    enableCalendarIntegration: process.env.FEATURE_CALENDAR_INTEGRATION !== 'false',
    enableEmailAutomation: process.env.FEATURE_EMAIL_AUTOMATION !== 'false',
    enableTaskManagement: process.env.FEATURE_TASK_MANAGEMENT !== 'false',
    enableProactiveAutomation: process.env.FEATURE_PROACTIVE_AUTOMATION !== 'false',
    enableAnalytics: process.env.FEATURE_ANALYTICS !== 'false',
    enableAdvancedLogging: process.env.FEATURE_ADVANCED_LOGGING !== 'false',
  },
  performance: {
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    rateLimitTtl: parseInt(process.env.RATE_LIMIT_TTL || '60000', 10),
    cacheDefaultTtl: parseInt(process.env.CACHE_DEFAULT_TTL || '300', 10),
    enableCaching: process.env.ENABLE_CACHING !== 'false',
    enableCompression: process.env.ENABLE_COMPRESSION !== 'false',
  },
});

/**
 * Default configuration export
 */
export default createConfiguration;

// Configuration validation helper
export const validateConfig = (config: any): string[] => {
  const errors: string[] = [];

  // Validate required API keys in production
  if (config.application?.environment === 'production') {
    if (!config.aiServices?.geminiApiKey) {
      errors.push('GEMINI_API_KEY is required in production');
    }
    if (!config.emailServices?.sendgridApiKey) {
      errors.push('SENDGRID_API_KEY is required in production');
    }
    if (!config.googleServices?.clientId || !config.googleServices?.clientSecret) {
      errors.push('Google OAuth credentials are required in production');
    }
    if (!config.security?.jwtSecret) {
      errors.push('JWT_SECRET is required in production');
    }
  }

  // Validate port range
  if (config.application?.port && (config.application.port < 1 || config.application.port > 65535)) {
    errors.push('PORT must be between 1 and 65535');
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (config.emailServices?.fromEmail && !emailRegex.test(config.emailServices.fromEmail)) {
    errors.push('SENDGRID_FROM_EMAIL must be a valid email address');
  }

  return errors;
};
