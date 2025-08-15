/**
 * Executive Assistant AI - Bootstrap Application
 * Professional NestJS Backend
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    // Create NestJS application
    const app = await NestFactory.create(AppModule, {
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

    // Swagger API Documentation
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Executive Assistant AI')
      .setDescription('AI-powered Executive Assistant automation platform with comprehensive API integrations')
      .setVersion('2.0.0')
      .setContact(
        'Executive Assistant AI Team',
        'https://github.com/your-org/executive-assistant-ai',
        'support@yourcompany.com'
      )
      .addServer(`http://localhost:${port}`, 'Development Server')
      .addApiKey(
        {
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
          description: 'API key for authentication',
        },
        'ApiKeyAuth'
      )
      .addTag('Tasks', 'Task management and prioritization')
      .addTag('Assistant', 'AI assistant and natural language processing')
      .addTag('Calendar', 'Calendar integration and scheduling')
      .addTag('Email', 'Email automation and templates')
      .addTag('System', 'System health and configuration')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig, {
      operationIdFactory: (controllerKey: string, methodKey: string) => methodKey,
      deepScanRoutes: true,
    });

    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'Executive Assistant AI - API Documentation',
      customfavIcon: '/favicon.ico',
      customCss: `
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info .title { color: #1976d2; }
        .swagger-ui .scheme-container { background: #fafafa; padding: 15px; }
      `,
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true,
        showCommonExtensions: true,
        docExpansion: 'none',
        defaultModelsExpandDepth: 2,
        defaultModelExpandDepth: 2,
      },
    });

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
    logger.log(`   • GET  /api/docs             - API Documentation (Swagger)`);
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
