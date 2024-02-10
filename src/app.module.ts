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
import { configuration } from './config';
import { ProductResolver } from './product/product.resolver';
import { FirebaseModule } from 'nestjs-firebase';

console.log({ nod: configuration().NODE_ENV });
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: configuration().NODE_ENV === 'dev' ? 'schema.gql' : true,
      playground: true,
    }),
    MongooseModule.forRoot(
      'mongodb+srv://admin:fng8LrZdG2BqKbh2@clusterqueue.knjjwp9.mongodb.net/?retryWrites=true&w=majority',
    ),
    FirebaseModule.forRoot({
      googleApplicationCredential:
        './src/firebase/orchid-fer-firebase-adminsdk-abbv0-f4ab971f7d.json',
    }),
    DryerModule.register({
      definitions: [
        {
          definition: Product,
          embeddedConfigs: [
            {
              property: 'type',
              allowedApis: ['findAll', 'findOne', 'create', 'update', 'remove'],
            },
          ],
          allowedApis: ['findAll', 'findOne', 'paginate'],
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
      providers: [ProductResolver],
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
