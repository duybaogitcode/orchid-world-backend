import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configuration } from './config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  console.log('port', configuration().port);
  await app.listen(configuration().port || 3000);
}
bootstrap();
