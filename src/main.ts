import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common/pipes';
import { ClassSerializerInterceptor, Logger } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger();
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors({ origin: 'http://localhost:5173', credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // Trasforma i payload in DTO automaticamente
      whitelist: true, // Rimuove proprietà non dichiarate nei DTO
      forbidNonWhitelisted: true, // (opzionale) Lancia errore se ci sono proprietà extra
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
  logger.log(`Application listening on port ${process.env.PORT ?? 3000}`);
}
bootstrap();
