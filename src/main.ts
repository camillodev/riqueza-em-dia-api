import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true,
  });

  // Configure middleware for raw body access
  app.use(json({
    verify: (req: express.Request, res: express.Response, buf: Buffer) => {
      // Make the raw body available for webhook verification
      if (req.url.includes('/api/webhooks/')) {
        (req as any).rawBody = buf;
      }
    },
  }));

  // Global validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));

  // Prefix all routes with /api
  app.setGlobalPrefix('api');

  // CORS setup
  app.enableCors();

  // Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle('Riqueza em Dia API')
    .setDescription('API documentation for Riqueza em Dia application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

const host = '0.0.0.0';
const port = process.env.PORT ?? 3000;
const userFriendlyLink = `http://${host}:${port}`;
console.log(`%cYour application is running at: ${userFriendlyLink} 🚀`, 'color: green;');

