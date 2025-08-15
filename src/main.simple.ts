/**
 * Executive Assistant AI - Simplified Bootstrap
 * Simplified version for immediate functionality
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppSimpleModule } from './app.simple.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    // Create NestJS application
    const app = await NestFactory.create(AppSimpleModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Get configuration service
    const configService = app.get(ConfigService);
    const port = configService.get('app.port', 3000);
    const nodeEnv = configService.get('app.environment', 'development');

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
        mode: 'simplified',
      });
    });

    // Start the application
    await app.listen(port);

    logger.log(`🚀 Executive Assistant AI started successfully!`);
    logger.log(`🌐 Server running on: http://localhost:${port}`);
    logger.log(`📊 Environment: ${nodeEnv}`);
    logger.log(`🔧 Mode: Simplified Architecture`);
    
    logger.log(`📋 Available endpoints:`);
    logger.log(`   • GET  /                     - Application info`);
    logger.log(`   • GET  /health               - Health check`);
    logger.log(`   • POST /api/assistant/process - Process AI requests`);
    logger.log(`   • GET  /api/assistant/briefing - Daily briefing`);
    logger.log(`   • GET  /api/tasks            - Get tasks`);
    logger.log(`   • POST /api/tasks            - Create task`);

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
