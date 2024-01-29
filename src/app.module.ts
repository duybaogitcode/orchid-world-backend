import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { MongooseModule } from '@nestjs/mongoose';
import { DryerModule } from 'dryerjs';
import { User } from './user/model';

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
    DryerModule.register({ definitions: [User] }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
