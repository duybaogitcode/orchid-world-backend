import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { MongooseModule } from '@nestjs/mongoose';
import { DryerModule } from 'dryerjs';
import { Product } from './product/product.definition';
import { Media } from './media/media.definition';
import { Category, Tag } from './base/base.definition';

@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: true,
      playground: true,
    }),
    MongooseModule.forRoot(
      'mongodb+srv://admin:fng8LrZdG2BqKbh2@clusterqueue.knjjwp9.mongodb.net/?retryWrites=true&w=majority',
    ),
    DryerModule.register({ definitions: [Product, Media, Tag, Category] }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
