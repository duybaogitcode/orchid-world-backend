import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configuration } from './config';
import { graphqlUploadExpress } from 'graphql-upload-ts';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'https://studio.apollographql.com',
      'https://orchid-world-frontend.vercel.app'
      'https://orchid.movie-world.store',
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  app.use(cookieParser());

  console.log(
    'port',
    configuration().port,
    configService.get<string>('DOMAIN'),
  );
  app.use(graphqlUploadExpress({ maxFileSize: 50000000, maxFiles: 10 }));
  await app.listen(configuration().port || 3000);
}
bootstrap();
