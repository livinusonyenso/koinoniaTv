import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
// @ts-ignore
import compression = require('compression');
import { join } from 'path';
import { mkdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Ensure uploads directory exists
  const audioDir = join(process.cwd(), 'uploads', 'audio');
  mkdirSync(audioDir, { recursive: true });

  // Serve uploaded audio files statically at /uploads/...
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });
  app.setGlobalPrefix('api/v1', { exclude: ['/'] });
  app.use(compression());
  // Root health/info route — before global prefix kicks in
  app.use('/', (req: any, res: any, next: any) => {
    if (req.method === 'GET' && req.path === '/') {
      return res.json({ status: 'running', service: 'Koinonia TV API', version: 'v1', environment: process.env.NODE_ENV || 'production' });
    }
    next();
  });
  app.enableCors({ origin: '*', credentials: true });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  const port = process.env.APP_PORT || 3000;
  await app.listen(port);
  console.log(`\n🚀  Koinonia TV API → http://localhost:${port}/api/v1`);
  console.log(`📺  YouTube sync active (cron jobs running)\n`);
}
bootstrap();
