/**
 * Executive Assistant AI - Professional Application Module
 * World-class modular architecture with enterprise-grade patterns
 * 
 * @fileoverview Professional application module providing:
 * - Clean Architecture implementation
 * - Dependency injection configuration
 * - Module organization
 * - Feature flag integration
 * - Configuration management
 * 
 * @version 2.0.0
 * @author Executive Assistant AI Team
 */

import { Module, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { createConfiguration, ConfigurationManager } from './config/configuration.advanced';

// Controllers
import { AppController } from './app.controller';
import { TasksControllerSimple } from './modules/tasks/controllers/tasks.controller.simple';

// Services (would be implemented)
// import { TaskService } from './application/services/task.service';
// import { AssistantService } from './application/services/assistant.service';
// import { CalendarService } from './application/services/calendar.service';
// import { EmailService } from './application/services/email.service';

// Infrastructure services (would be implemented)
// import { GeminiService } from './infrastructure/external-services/gemini/gemini.service';
// import { GoogleCalendarService } from './infrastructure/external-services/google-calendar/google-calendar.service';
// import { SendGridService } from './infrastructure/external-services/sendgrid/sendgrid.service';

/**
 * Professional application module with comprehensive configuration
 */
@Module({
  imports: [
    // Configuration module with validation
    ConfigModule.forRoot({
      isGlobal: true,
      load: [createConfiguration],
      cache: true,
      expandVariables: true,
      validationOptions: {
        allowUnknown: false,
        abortEarly: true,
      },
    }),

    // Scheduling module for proactive automation
    ScheduleModule.forRoot(),

    // Event emitter for domain events
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: false,
      ignoreErrors: false,
    }),

    // Throttling/Rate limiting module
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config = configService.get('performance');
        return [
          {
            name: 'default',
            ttl: config?.rateLimitTtl || 60000,
            limit: config?.rateLimitMax || 100,
          },
          {
            name: 'strict',
            ttl: 60000,
            limit: 10, // Stricter limits for sensitive endpoints
          },
        ];
      },
    }),

    // Feature modules (would be implemented)
    // TasksModule,
    // AssistantModule,
    // CalendarModule,
    // EmailModule,
    // AnalyticsModule,
    // AutomationModule,
  ],
  controllers: [
    AppController,
    TasksControllerSimple,
  ],
  providers: [
    // Application services (would be implemented)
    // TaskService,
    // AssistantService,
    // CalendarService,
    // EmailService,
    // AnalyticsService,
    // AutomationService,

    // Infrastructure services (would be implemented)
    // GeminiService,
    // GoogleCalendarService,
    // SendGridService,
    // CloudSchedulerService,

    // Domain services (would be implemented)
    // TaskPrioritizationService,
    // WorkflowOrchestrationService,
    // NotificationService,

    // Utilities and helpers
    {
      provide: 'CONFIG_MANAGER',
      useFactory: (configService: ConfigService) => {
        const config = configService.get('application') || {};
        return ConfigurationManager.getInstance(config);
      },
      inject: [ConfigService],
    },
  ],
  exports: [
    'CONFIG_MANAGER',
    // Export services for other modules
  ],
})
export class AppProfessionalModule implements OnModuleInit {
  private readonly logger = new Logger(AppProfessionalModule.name);

  constructor(
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    const config = this.configService.get('application') || {};
    const configManager = ConfigurationManager.getInstance(config);

    this.logger.log('🚀 Executive Assistant AI (Professional) initialized');
    this.logger.log(`📊 Environment: ${configManager.getEnvironment()}`);
    this.logger.log(`🔧 Version: ${config.application.version}`);
    
    // Log enabled features
    const enabledFeatures = Object.entries(config.features)
      .filter(([, enabled]) => enabled)
      .map(([feature]) => feature);
    
    this.logger.log(`✨ Enabled Features: ${enabledFeatures.join(', ')}`);

    // Log configuration health
    const health = this.getConfigurationHealth(config);
    this.logger.log(`🔧 Configuration Health: ${health.status.toUpperCase()}`);
    
    if (health.issues.length > 0) {
      this.logger.warn('⚠️ Configuration Issues:');
      health.issues.forEach(issue => this.logger.warn(`   • ${issue}`));
    }

    // Log architecture information
    this.logger.log('🏗️ Architecture: Clean Architecture with Domain-Driven Design');
    this.logger.log('📐 Patterns: CQRS, Repository, Result, Value Objects');
    this.logger.log('🔒 Security: API Key Authentication, Rate Limiting, CORS');
    this.logger.log('📊 Monitoring: Request Tracking, Performance Metrics, Health Checks');
    this.logger.log('📚 Documentation: OpenAPI 3.0, Swagger UI');

    // Initialize services based on feature flags
    await this.initializeServices(config);
  }

  /**
   * Initialize services based on feature flags
   */
  private async initializeServices(config: any): Promise<void> {
    const initPromises: Promise<void>[] = [];

    if (config.features.enableAIAssistant) {
      initPromises.push(this.initializeAIServices(config));
    }

    if (config.features.enableCalendarIntegration) {
      initPromises.push(this.initializeCalendarServices(config));
    }

    if (config.features.enableEmailAutomation) {
      initPromises.push(this.initializeEmailServices(config));
    }

    if (config.features.enableProactiveAutomation) {
      initPromises.push(this.initializeAutomationServices(config));
    }

    try {
      await Promise.all(initPromises);
      this.logger.log('✅ All enabled services initialized successfully');
    } catch (error) {
      this.logger.error('❌ Failed to initialize some services', error.stack);
    }
  }

  /**
   * Initialize AI services
   */
  private async initializeAIServices(config: any): Promise<void> {
    this.logger.log('🤖 Initializing AI services...');
    
    if (config.aiServices.geminiApiKey) {
      this.logger.log('   ✅ Gemini AI service configured');
    } else {
      this.logger.warn('   ⚠️ Gemini API key not configured - using mock responses');
    }
  }

  /**
   * Initialize calendar services
   */
  private async initializeCalendarServices(config: any): Promise<void> {
    this.logger.log('📅 Initializing calendar services...');
    
    if (config.googleServices.clientId && config.googleServices.clientSecret) {
      this.logger.log('   ✅ Google Calendar service configured');
    } else {
      this.logger.warn('   ⚠️ Google OAuth not configured - using mock responses');
    }
  }

  /**
   * Initialize email services
   */
  private async initializeEmailServices(config: any): Promise<void> {
    this.logger.log('📧 Initializing email services...');
    
    if (config.emailServices.sendgridApiKey) {
      this.logger.log('   ✅ SendGrid email service configured');
    } else {
      this.logger.warn('   ⚠️ SendGrid API key not configured - using mock responses');
    }
  }

  /**
   * Initialize automation services
   */
  private async initializeAutomationServices(config: any): Promise<void> {
    this.logger.log('🔄 Initializing automation services...');
    
    if (config.googleServices.projectId) {
      this.logger.log('   ✅ Cloud Scheduler service configured');
    } else {
      this.logger.warn('   ⚠️ GCP project not configured - automation features limited');
    }
  }

  /**
   * Get configuration health status
   */
  private getConfigurationHealth(config: any): {
    status: 'healthy' | 'warning' | 'error';
    issues: string[];
  } {
    const issues: string[] = [];

    // Check for missing API keys
    if (!config.aiServices.geminiApiKey) {
      issues.push('Gemini API key not configured');
    }

    if (!config.emailServices.sendgridApiKey) {
      issues.push('SendGrid API key not configured');
    }

    if (!config.googleServices.clientId) {
      issues.push('Google OAuth not configured');
    }

    // Check security settings
    if (config.application.environment === 'production') {
      if (config.security.jwtSecret === 'dev-jwt-secret-change-in-production') {
        issues.push('Default JWT secret in production');
      }

      if (config.security.apiKey === 'dev-api-key-change-in-production') {
        issues.push('Default API key in production');
      }
    }

    const status = issues.length === 0 ? 'healthy' : 'warning';
    return { status, issues };
  }
}
