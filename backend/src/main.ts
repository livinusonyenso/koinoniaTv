import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
// @ts-ignore
import compression = require('compression');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.use(compression());
  app.enableCors({ origin: '*', credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = process.env.APP_PORT || 3000;
  await app.listen(port);
  console.log(`\n🚀  Koinonia TV API → http://localhost:${port}/api/v1`);
  console.log(`📺  YouTube sync active (cron jobs running)\n`);
}
bootstrap();
