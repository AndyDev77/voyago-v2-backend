import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
  });

  // Raw body middleware for Stripe webhooks — must be registered before JSON parser
  app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

  // JSON body parser for all other routes
  app.use((req, res, next) => {
    if (req.path === '/api/webhooks/stripe') {
      return next();
    }
    express.json()(req, res, next);
  });

  app.use((req, res, next) => {
    if (req.path === '/api/webhooks/stripe') {
      return next();
    }
    express.urlencoded({ extended: true })(req, res, next);
  });

  app.setGlobalPrefix('api');

  app.enableCors({ origin: '*' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  const port = process.env.PORT || 8001;
  await app.listen(port);
  console.log(`Voyago API running on port ${port}`);
}

bootstrap();
