import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, Logger } from '@nestjs/common';
import * as express from 'express';
import { json } from 'express';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Get configuration service
  const configService = app.get(ConfigService);
  const isProduction = configService.get('app.isProd', false);
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

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: false,
    },
  }));

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

  // Swagger documentation setup (only in non-production environments)
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Riqueza em Dia API')
      .setDescription('API documentation for Riqueza em Dia application')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`Environment: ${isProduction ? 'Production' : 'Development'}`);
}

bootstrap().catch((err) => {
  const logger = new Logger('Bootstrap');
  logger.error(`Failed to start application: ${err.message}`, err.stack);
  process.exit(1);
});

