import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common/pipes';
import { ClassSerializerInterceptor, Logger } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger();
  const app = await NestFactory.create(AppModule);

  app.use((req, res, next) => {
    logger.log(`${req.method} ${req.url} - IP: ${req.ip}`);
    next();
  });

  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:4200',
      'http://192.168.1.16:4200',
      'http://192.168.1.16',
    ],

    credentials: true,
  });

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Trasforma i payload in DTO automaticamente
      whitelist: true, // Rimuove proprietà non dichiarate nei DTO
      forbidNonWhitelisted: true, // (opzionale) Lancia errore se ci sono proprietà extra,
    }),
  );

  const port = process.env.PORT ?? 3000;

  // Ascolta su tutte le interfacce di rete
  await app.listen(port, '0.0.0.0');

  logger.log(`Application listening on port ${port}`);
  logger.log(`Local: http://localhost:${port}`);
  logger.log(`Network: http://192.168.1.15:${port}`);
}
bootstrap();
