import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, LogLevel } from '@nestjs/common';
import * as express from 'express';
import { json } from 'express';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Get environment variables
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProduction = nodeEnv === 'production';

  // Configure log levels based on environment - always enable debug logs for development
  const logLevels: LogLevel[] = isProduction
    ? ['error', 'warn', 'log']
    : ['error', 'warn', 'log', 'debug', 'verbose'];

  logger.log(`Starting application in ${nodeEnv} mode with log levels: ${logLevels.join(', ')}`);

  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    logger: logLevels,
    // Force debug logs to be displayed
    abortOnError: false,
  });

  // Get configuration service
  const configService = app.get(ConfigService);
  const port = configService.get('app.port', 3001);

  // Security headers middleware
  app.use(helmet());

  // Parse cookies
  app.use(cookieParser());

  // Configure middleware for raw body access
  app.use(json({
    verify: (req: express.Request, res: express.Response, buf: Buffer) => {
      // Make the raw body available for webhook verification
      if (req.url.includes('/api/webhooks/')) {
        (req as any).rawBody = buf;
      }
    },
    limit: '10mb', // Limit body size
  }));

  // Removemos o pipe global em favor do ZodValidationPipe específico
  // Isso evita conflitos de validação e simplifica o fluxo

  // Configure trusted proxies for production
  if (isProduction) {
    // Use the Express app for trusting proxies
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.set('trust proxy', 1);
  }

  // Prefix all routes with /api
  app.setGlobalPrefix('api');

  // CORS setup with more restrictive settings for production
  app.enableCors({
    origin: isProduction
      ? configService.get('app.cors.origins', ['https://riquezaemdia.com.br'])
      : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true,
    maxAge: 86400, // 24 hours
  });

  // Configure Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Riqueza em Dia API')
    .setDescription('API for financial tracking and management')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document);

  // Start the server
  await app.listen(port);
  logger.log(`Application started on port ${port}`);
}

bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  logger.error(`Failed to start application: ${err.message}`, err.stack);
  process.exit(1);
});

