
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { GlobalExceptionFilter } from './shared/filters/global-exception.filter';
import { ResponseInterceptor } from './shared/interceptors/response.interceptor';

async function bootstrap() {

  console.log('NODE_ENV Environment:', process.env.NODE_ENV);

  // Load .env file based on NODE_ENV
  const env = process.env.NODE_ENV || 'development';

  console.log('Node Environment:', env);

  const envFile = env === 'development' ? '.env.development' : `.env.${env}`;
  dotenv.config({ path: envFile });

  console.log('Environment variables loaded from:', envFile);

  // log startup message
  console.log('Starting application...');

  const app = await NestFactory.create(AppModule);
  
  // Register global response interceptor
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  // log app start URL
  console.log(`Application is running on: http://localhost:${process.env.PORT}`);
  await app.listen(process.env.PORT!);
}
bootstrap();