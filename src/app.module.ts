/**
 * Root Application Module
 * Executive Assistant AI - Professional Clean Architecture Backend
 */

import { Module, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

// Configuration
import configuration from './config/configuration';

// Presentation Layer Modules
import { AssistantModule } from './modules/assistant/assistant.module';
import { CalendarModule } from './modules/calendar/calendar.module';
import { EmailModule } from './modules/email/email.module';
import { TaskModule } from './modules/task/task.module';
import { AutomationModule } from './modules/automation/automation.module';

// Application Layer
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Enterprise Configuration
import { ServiceFactory } from './common/factories/service.factory';
import { DynamicConfigurationManager } from './common/configuration/dynamic-config.manager';

@Module({
  imports: [
    // Global Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),

    // Scheduling for Proactive Automation
    ScheduleModule.forRoot(),

    // Business Domain Modules
    AssistantModule,
    CalendarModule,
    EmailModule,
    TaskModule,
    AutomationModule,
  ],

  controllers: [AppController],
  providers: [
    AppService,
    ServiceFactory,
    DynamicConfigurationManager,
  ],
})
export class AppModule implements OnModuleInit {
  private readonly logger = new Logger(AppModule.name);

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const appName = 'Executive Assistant AI';
    const appVersion = '2.0.0';
    const environment = this.configService.get('NODE_ENV', 'development');
    const port = this.configService.get('PORT', 3000);

    this.logger.log(
      `🚀 ${appName} v${appVersion} starting in ${environment} mode`,
    );
    this.logger.log(`📡 Server will be available on port ${port}`);

    // Log feature status
    this.logFeatureStatus();

    this.logger.log('✅ Application module initialized successfully');
  }

  private logFeatureStatus(): void {
    const features = {
      aiProcessing: !!this.configService.get('GEMINI_API_KEY'),
      calendarSync: !!this.configService.get('GOOGLE_CLIENT_ID'),
      emailAutomation: !!this.configService.get('SENDGRID_API_KEY'),
      taskManagement: true,
      proactiveAutomation: true,
      analytics: true,
    };

    this.logger.log('🎛️  Feature Status:', JSON.stringify(features, null, 2));
  }

  // Health check method
  public getHealth(): { status: string; details: any } {
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    return {
      status: 'healthy',
      details: {
        application: 'Executive Assistant AI',
        version: '2.0.0',
        environment: this.configService.get('NODE_ENV', 'development'),
        uptime: `${Math.floor(uptime / 60)} minutes`,
        memory: {
          used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`,
          total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
        },
        timestamp: new Date().toISOString(),
      },
    };
  }
}
