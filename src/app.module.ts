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
import { Auction, AuctionBiddingHistory } from './auction/auction.definition';
import { User } from './user/user.definition';
import { Permission, Role } from './auth/auth.definition';

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
    DryerModule.register({
      definitions: [
        {
          definition: Product,
          embeddedConfigs: [
            {
              property: 'type',
              allowedApis: ['create', 'findAll', 'findOne', 'remove', 'update'],
            },
          ],
        },
        User,
        Role,
        Permission,
        Media,
        Tag,
        Category,
        Auction,
        AuctionBiddingHistory,
      ],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
