import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configuration } from './config';
import { graphqlUploadExpress } from 'graphql-upload-ts';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://studio.apollographql.com',
      'https://orchid-world-frontend.vercel.app',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  app.use(cookieParser());

  console.log('port', configuration().port);
  app.use(graphqlUploadExpress({ maxFileSize: 50000000, maxFiles: 10 }));
  await app.listen(configuration().port || 3000);
}
bootstrap();
