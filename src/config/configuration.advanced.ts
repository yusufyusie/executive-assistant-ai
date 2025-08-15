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

import { IsString, IsNumber, IsBoolean, IsOptional, IsEmail, IsUrl, IsEnum, Min, Max, validateSync } from 'class-validator';
import { Transform, Type, plainToClass } from 'class-transformer';

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
  const config = plainToClass(AppConfig, {
    application: {
      name: process.env.APP_NAME,
      version: process.env.APP_VERSION,
      environment: process.env.NODE_ENV,
      port: process.env.PORT,
      logLevel: process.env.LOG_LEVEL,
      timezone: process.env.TIMEZONE,
      enableMetrics: process.env.ENABLE_METRICS,
      enableHealthChecks: process.env.ENABLE_HEALTH_CHECKS,
    },
    aiServices: {
      geminiApiKey: process.env.GEMINI_API_KEY,
      geminiModel: process.env.GEMINI_MODEL,
      maxTokens: process.env.GEMINI_MAX_TOKENS,
      temperature: process.env.GEMINI_TEMPERATURE,
      requestsPerMinute: process.env.GEMINI_REQUESTS_PER_MINUTE,
    },
    googleServices: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
      refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
      projectId: process.env.GCP_PROJECT_ID,
      region: process.env.GCP_REGION,
    },
    emailServices: {
      sendgridApiKey: process.env.SENDGRID_API_KEY,
      fromEmail: process.env.SENDGRID_FROM_EMAIL,
      fromName: process.env.SENDGRID_FROM_NAME,
      dailyLimit: process.env.EMAIL_DAILY_LIMIT,
      enableTemplates: process.env.ENABLE_EMAIL_TEMPLATES,
    },
    security: {
      jwtSecret: process.env.JWT_SECRET,
      apiKey: process.env.API_KEY,
      jwtExpirationTime: process.env.JWT_EXPIRATION_TIME,
      enableCors: process.env.ENABLE_CORS,
      enableRateLimit: process.env.ENABLE_RATE_LIMIT,
    },
    performance: {
      rateLimitMax: process.env.RATE_LIMIT_MAX,
      rateLimitTtl: process.env.RATE_LIMIT_TTL,
      cacheDefaultTtl: process.env.CACHE_DEFAULT_TTL,
      enableCaching: process.env.ENABLE_CACHING,
      enableCompression: process.env.ENABLE_COMPRESSION,
    },
    features: {
      enableAIAssistant: process.env.FEATURE_AI_ASSISTANT,
      enableCalendarIntegration: process.env.FEATURE_CALENDAR_INTEGRATION,
      enableEmailAutomation: process.env.FEATURE_EMAIL_AUTOMATION,
      enableTaskManagement: process.env.FEATURE_TASK_MANAGEMENT,
      enableProactiveAutomation: process.env.FEATURE_PROACTIVE_AUTOMATION,
      enableAnalytics: process.env.FEATURE_ANALYTICS,
      enableAdvancedLogging: process.env.FEATURE_ADVANCED_LOGGING,
    },
  });

  // Validate configuration
  const errors = validateSync(config, {
    whitelist: true,
    forbidNonWhitelisted: true,
  });

  if (errors.length > 0) {
    const errorMessages = errors.map(error =>
      Object.values(error.constraints || {}).join(', ')
    ).join('; ');
    throw new Error(`Configuration validation failed: ${errorMessages}`);
  }

  return config;
};

/**
 * Configuration validation utilities
 */
export class ConfigurationValidator {
  /**
   * Validate configuration for production environment
   */
  static validateProductionConfig(config: AppConfig): string[] {
    const errors: string[] = [];

    if (config.application.environment === Environment.PRODUCTION) {
      // AI Services validation
      if (!config.aiServices.geminiApiKey) {
        errors.push('GEMINI_API_KEY is required in production');
      }

      // Email services validation
      if (!config.emailServices.sendgridApiKey) {
        errors.push('SENDGRID_API_KEY is required in production');
      }

      // Google services validation
      if (!config.googleServices.clientId || !config.googleServices.clientSecret) {
        errors.push('Google OAuth credentials are required in production');
      }

      // Security validation
      if (config.security.jwtSecret === 'dev-jwt-secret-change-in-production') {
        errors.push('JWT_SECRET must be changed in production');
      }

      if (config.security.apiKey === 'dev-api-key-change-in-production') {
        errors.push('API_KEY must be changed in production');
      }
    }

    return errors;
  }

  /**
   * Validate API rate limits and quotas
   */
  static validateApiLimits(config: AppConfig): string[] {
    const errors: string[] = [];

    // Gemini API limits (free tier: 15 requests/minute)
    if (config.aiServices.requestsPerMinute > 15) {
      errors.push('GEMINI_REQUESTS_PER_MINUTE exceeds free tier limit of 15');
    }

    // SendGrid limits (free tier: 100 emails/day)
    if (config.emailServices.dailyLimit > 100) {
      errors.push('EMAIL_DAILY_LIMIT exceeds free tier limit of 100');
    }

    return errors;
  }

  /**
   * Get configuration health status
   */
  static getConfigurationHealth(config: AppConfig): {
    status: 'healthy' | 'warning' | 'error';
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for missing API keys
    if (!config.aiServices.geminiApiKey) {
      issues.push('Gemini API key not configured - AI features will use mock responses');
      recommendations.push('Add GEMINI_API_KEY to enable AI functionality');
    }

    if (!config.emailServices.sendgridApiKey) {
      issues.push('SendGrid API key not configured - email features will use mock responses');
      recommendations.push('Add SENDGRID_API_KEY to enable email functionality');
    }

    if (!config.googleServices.clientId) {
      issues.push('Google OAuth not configured - calendar features will use mock responses');
      recommendations.push('Add Google OAuth credentials to enable calendar functionality');
    }

    // Performance recommendations
    if (config.performance.rateLimitMax > 200) {
      recommendations.push('Consider lowering rate limit for better resource management');
    }

    if (!config.performance.enableCaching) {
      recommendations.push('Enable caching for better performance');
    }

    // Security recommendations
    if (config.application.environment === Environment.PRODUCTION) {
      if (!config.security.enableRateLimit) {
        issues.push('Rate limiting disabled in production');
        recommendations.push('Enable rate limiting for production security');
      }
    }

    const status = issues.length > 0 ? 'warning' : 'healthy';

    return { status, issues, recommendations };
  }
}

/**
 * Configuration manager for runtime updates
 */
export class ConfigurationManager {
  private static instance: ConfigurationManager;
  private config: AppConfig;

  private constructor(config: AppConfig) {
    this.config = config;
  }

  static getInstance(config?: AppConfig): ConfigurationManager {
    if (!ConfigurationManager.instance) {
      if (!config) {
        throw new Error('Configuration must be provided for first initialization');
      }
      ConfigurationManager.instance = new ConfigurationManager(config);
    }
    return ConfigurationManager.instance;
  }

  getConfig(): AppConfig {
    return this.config;
  }

  updateFeatureFlag(feature: keyof FeatureFlagsConfig, enabled: boolean): void {
    this.config.features[feature] = enabled;
  }

  isFeatureEnabled(feature: keyof FeatureFlagsConfig): boolean {
    return this.config.features[feature];
  }

  getEnvironment(): Environment {
    return this.config.application.environment;
  }

  isProduction(): boolean {
    return this.config.application.environment === Environment.PRODUCTION;
  }

  isDevelopment(): boolean {
    return this.config.application.environment === Environment.DEVELOPMENT;
  }
}

/**
 * Default configuration export
 */
export default createConfiguration;
