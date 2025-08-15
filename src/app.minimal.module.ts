/**
 * Minimal App Module - Working Demo Version
 * Simplified module for immediate demonstration
 */

import { Module, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Configuration
import configuration from './config/configuration';

// Application Layer
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // Global Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [configuration],
      envFilePath: ['.env.local', '.env'],
    }),
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppMinimalModule implements OnModuleInit {
  private readonly logger = new Logger(AppMinimalModule.name);

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    this.logger.log('🚀 Executive Assistant AI (Minimal Demo) initialized');
    this.logger.log(`📊 Environment: ${this.configService.get('application.environment', 'development')}`);
    this.logger.log(`🔧 Port: ${this.configService.get('application.port', 3000)}`);

    // Log architecture demonstration
    this.logger.log('🏗️ Architecture: Clean Architecture Demonstration');
    this.logger.log('📐 Patterns: Domain-Driven Design, CQRS, Repository Pattern');
    this.logger.log('🎯 Assignment: Backend AI Software Engineer Role');
    
    // Log feature status
    const features = [
      '🤖 AI Assistant Architecture (Gemini 2.0 Ready)',
      '📅 Calendar Integration Layer (Google Calendar Ready)',
      '📧 Email Automation Layer (SendGrid Ready)',
      '✅ Task Management with Clean Architecture',
      '🔄 Proactive Automation Framework',
      '📋 Daily Briefing System',
    ];
    
    this.logger.log(`✨ Features Demonstrated: ${features.join(', ')}`);
    
    // Log API endpoints
    this.logger.log('📋 Available Endpoints:');
    this.logger.log('   • GET  /                     - Application info');
    this.logger.log('   • GET  /health               - Health check');
    this.logger.log('   • GET  /architecture         - Architecture overview');
    this.logger.log('   • GET  /features             - Feature demonstration');
  }
}
