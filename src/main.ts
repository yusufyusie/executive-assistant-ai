/**
 * Executive Assistant AI - Bootstrap Application
 * Professional NestJS Backend
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppMinimalModule } from './app.minimal.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    // Create NestJS application
    const app = await NestFactory.create(AppMinimalModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Get configuration service
    const configService = app.get(ConfigService);
    const port = configService.get('PORT', 3000);
    const nodeEnv = configService.get('NODE_ENV', 'development');

    // Global pipes
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // CORS configuration
    app.enableCors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
      credentials: true,
    });

    // Health check endpoint
    app.getHttpAdapter().get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: nodeEnv,
        version: '1.0.0',
      });
    });

    // Start the application
    await app.listen(port);

    logger.log(`🚀 Executive Assistant AI started successfully!`);
    logger.log(`🌐 Server running on: http://localhost:${port}`);
    logger.log(`📊 Environment: ${nodeEnv}`);
    logger.log(`🔧 Features: AI Assistant, Calendar, Email, Tasks, Automation`);

    logger.log(`📋 Available endpoints:`);
    logger.log(`   • GET  /                     - Application info`);
    logger.log(`   • GET  /health               - Health check`);
    logger.log(`   • POST /api/assistant/process - Process AI requests`);
    logger.log(`   • GET  /api/calendar/events  - Get calendar events`);
    logger.log(`   • POST /api/email/send       - Send emails`);
    logger.log(`   • GET  /api/tasks            - Get tasks`);
    logger.log(`   • GET  /api/automation/briefing - Daily briefing`);

  } catch (error) {
    logger.error('❌ Failed to start application', error.stack);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

bootstrap();
