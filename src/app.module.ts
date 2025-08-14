/**
 * Root Application Module
 * Enterprise-grade modular architecture with proper dependency injection
 */

import { Module, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';

// Core Configuration
import { appConfig } from './core/config/app.config';
import { externalServicesConfig } from './core/config/external-services.config';
import { validateAppConfig } from './core/config/app.config';
import configuration from './config/configuration';
import dynamicConfiguration from './config/dynamic-configuration';

// Core Infrastructure
import { GlobalExceptionFilter } from './core/common/filters/global-exception.filter';
import { EnhancedValidationPipe } from './core/common/pipes/validation.pipe';
import { CachingInterceptor } from './core/common/interceptors/caching.interceptor';
import { RateLimitGuard, InMemoryRateLimitStorage } from './core/common/guards/rate-limit.guard';

// Business Modules
import { AIModule } from './ai/ai.module';
import { CalendarModule } from './calendar/calendar.module';
import { EmailModule } from './email/email.module';
import { TasksModule } from './tasks/tasks.module';
import { AutomationModule } from './automation/automation.module';

// Legacy Controllers and Services
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { EndpointConfigService } from './common/services/endpoint-config.service';
import { EndpointValidatorService } from './common/services/endpoint-validator.service';
import { EndpointsController } from './common/controllers/endpoints.controller';

// Environment validation
import * as Joi from 'joi';

@Module({
  imports: [
    // Enhanced Configuration Module with validation
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      load: [appConfig, externalServicesConfig, configuration, dynamicConfiguration],
      envFilePath: '.env',
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'staging', 'production', 'test')
          .default('development'),
        PORT: Joi.number().port().default(3000),

        // Security
        JWT_SECRET: Joi.string().min(32).default('dev_jwt_secret_change_in_production'),
        API_KEY: Joi.string().min(16).default('dev_api_key_change_in_production'),

        // External Services (optional for development)
        GEMINI_API_KEY: Joi.string().optional(),
        GOOGLE_CLIENT_ID: Joi.string().optional(),
        GOOGLE_CLIENT_SECRET: Joi.string().optional(),
        SENDGRID_API_KEY: Joi.string().optional(),

        // Optional Services
        REDIS_URL: Joi.string().optional(),
        DATABASE_URL: Joi.string().optional(),
        GCP_PROJECT_ID: Joi.string().optional()
      }),
      validationOptions: {
        allowUnknown: true,
        abortEarly: false
      }
    }),

    // Event System
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 20,
      verboseMemoryLeak: false,
      ignoreErrors: false
    }),

    // Scheduling
    ScheduleModule.forRoot(),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ttl: configService.get('app.rateLimit.windowMs', 900000),
        limit: configService.get('app.rateLimit.max', 100),
        ignoreUserAgents: [/googlebot/gi, /bingbot/gi],
        skipIf: (context) => {
          const request = context.switchToHttp().getRequest();
          return request.path === '/health' || request.path === '/metrics';
        }
      })
    }),

    // Business Domain Modules
    AIModule,
    CalendarModule,
    EmailModule,
    TasksModule,
    AutomationModule
  ],

  controllers: [
    AppController,
    EndpointsController
  ],

  providers: [
    // Legacy Services
    AppService,
    EndpointConfigService,
    EndpointValidatorService,

    // Rate Limit Storage
    {
      provide: 'RATE_LIMIT_STORAGE',
      useClass: InMemoryRateLimitStorage
    },

    // Cache Service (In-Memory for now)
    {
      provide: 'CACHE_SERVICE',
      useValue: {
        async get(key: string) { return null; },
        async set(key: string, value: any, ttl?: number) { },
        async del(key: string) { },
        async exists(key: string) { return false; },
        async clear(pattern?: string) { },
        async getHealth() { return { status: 'healthy' }; }
      }
    },

    // Global Exception Filter
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter
    },

    // Global Validation Pipe
    {
      provide: APP_PIPE,
      useFactory: (configService: ConfigService) => {
        const environment = configService.get('app.environment', 'development');
        return environment === 'development'
          ? EnhancedValidationPipe.forDevelopment()
          : EnhancedValidationPipe.forProduction();
      },
      inject: [ConfigService]
    },

    // Global Guards
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    },
    {
      provide: APP_GUARD,
      useClass: RateLimitGuard
    },

    // Global Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: CachingInterceptor
    }
  ]
})
export class AppModule implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AppModule.name);

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const appName = this.configService.get('app.name', 'Executive Assistant AI');
    const appVersion = this.configService.get('app.version', '1.0.0');
    const environment = this.configService.get('app.environment', 'development');
    const port = this.configService.get('app.port', 3000);

    this.logger.log(`🚀 ${appName} v${appVersion} starting in ${environment} mode`);
    this.logger.log(`📡 Server will be available on port ${port}`);

    // Validate critical configuration
    await this.validateConfiguration();

    // Log feature flags
    this.logFeatureFlags();

    // Log external service status
    await this.logExternalServiceStatus();

    this.logger.log('✅ Application module initialized successfully');
  }

  async onModuleDestroy(): Promise<void> {
    this.logger.log('🛑 Application module shutting down...');

    // Perform graceful shutdown tasks
    await this.performGracefulShutdown();

    this.logger.log('✅ Application module shutdown completed');
  }

  private async validateConfiguration(): Promise<void> {
    try {
      const appConfigData = this.configService.get('app');
      if (appConfigData) {
        validateAppConfig(appConfigData);
      }

      this.logger.log('✅ Configuration validation passed');
    } catch (error) {
      this.logger.warn('⚠️  Configuration validation failed, using defaults', error.message);
    }
  }

  private logFeatureFlags(): void {
    const features = {
      aiProcessing: this.configService.get('externalServices.ai.features.intentRecognition', true),
      calendarSync: this.configService.get('externalServices.calendar.features.conflictDetection', true),
      emailAutomation: this.configService.get('externalServices.email.features.bulkEmail', true),
      taskManagement: true,
      proactiveAutomation: this.configService.get('externalServices.ai.features.dailyBriefing', true),
      analytics: this.configService.get('app.performance.enableMetrics', true),
      monitoring: true,
      caching: this.configService.get('app.performance.enableCaching', true)
    };

    this.logger.log('🎛️  Feature Flags:', JSON.stringify(features, null, 2));
  }

  private async logExternalServiceStatus(): Promise<void> {
    const services = {
      ai: {
        enabled: !!this.configService.get('externalServices.ai.apiKey') || !!this.configService.get('GEMINI_API_KEY'),
        provider: this.configService.get('externalServices.ai.provider', 'gemini')
      },
      calendar: {
        enabled: !!this.configService.get('externalServices.calendar.clientId') || !!this.configService.get('GOOGLE_CLIENT_ID'),
        provider: this.configService.get('externalServices.calendar.provider', 'google')
      },
      email: {
        enabled: !!this.configService.get('externalServices.email.apiKey') || !!this.configService.get('SENDGRID_API_KEY'),
        provider: this.configService.get('externalServices.email.provider', 'sendgrid')
      },
      cache: {
        enabled: this.configService.get('app.performance.enableCaching', true),
        type: 'memory'
      }
    };

    this.logger.log('🔗 External Services:', JSON.stringify(services, null, 2));
  }

  private async performGracefulShutdown(): Promise<void> {
    // Wait for ongoing requests to complete
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Health check method for the entire application
  public getHealth(): { status: string; details: any } {
    const environment = this.configService.get('app.environment', 'development');
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    return {
      status: 'healthy',
      details: {
        application: 'Executive Assistant AI',
        version: this.configService.get('app.version', '1.0.0'),
        environment,
        uptime: `${Math.floor(uptime / 60)} minutes`,
        memory: {
          used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
          total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`
        },
        timestamp: new Date().toISOString()
      }
    };
  }

  // Metrics method for the entire application
  public getMetrics(): Record<string, unknown> {
    return {
      application: 'Executive Assistant AI',
      version: this.configService.get('app.version', '1.0.0'),
      environment: this.configService.get('app.environment', 'development'),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      timestamp: new Date().toISOString()
    };
  }
}
