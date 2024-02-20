import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { MongooseModule } from '@nestjs/mongoose';
import { DryerModule } from 'dryerjs';
import { Product } from './product/product.definition';
import { Media } from './media/media.definition';
import { Auction, AuctionBiddingHistory } from './auction/auction.definition';
import { User } from './user/user.definition';
import { Permission, Role } from './auth/auth.definition';
import { configuration } from './config';
import { ProductResolver } from './product/product.resolver';
import { FirebaseModule } from 'nestjs-firebase';
import { Tags } from './orthersDef/tags.definition';
import { TagWithValues } from './orthersDef/tagValues.definition';
import { Categories } from './orthersDef/categories.definition';
import { AuthResolver } from './auth/auth.resolver';
import { JwtModule } from '@nestjs/jwt';
import { Ctx } from './auth/ctx';
import { RoleGuard } from './auth/role.guard';
import { create } from 'domain';
import { ProductHook } from './product/product.hooks';
import { FirebaseService } from './firebase/firebase.serivce';
import { ProductService } from './product/product.service';
import { CartItem } from './cart/definition/cartItem.definiton';
import { CartShopItem } from './cart/definition/cartShopItem.definition';
import { Cart } from './cart/definition/cart.definition';

console.log({ nod: configuration().NODE_ENV });
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: configuration().NODE_ENV === 'dev' ? 'schema.gql' : true,
      playground: true,
    }),
    MongooseModule.forRoot(
      'mongodb+srv://admin:fng8LrZdG2BqKbh2@clusterqueue.knjjwp9.mongodb.net/OrchidSample?retryWrites=true&w=majority',
    ),
    FirebaseModule.forRoot({
      googleApplicationCredential:
        './src/firebase/orchid-fer-firebase-adminsdk-abbv0-f4ab971f7d.json',
    }),
    DryerModule.register({
      definitions: [
        {
          definition: Product,
          // embeddedConfigs: [
          //   {
          //     property: 'type',
          //     allowedApis: ['findAll', 'findOne', 'create', 'update', 'remove'],
          //   },
          // ],
          allowedApis: ['findAll', 'findOne', 'paginate'],
        },

        {
          definition: Tags,
          allowedApis: ['findAll', 'findOne', 'create', 'update', 'remove'],
        },
        {
          definition: TagWithValues,
          allowedApis: [],
        },
        {
          definition: Categories,
          allowedApis: ['findAll', 'findOne', 'create', 'update', 'remove'],
        },
        {
          definition: User,
          allowedApis: ['findAll', 'findOne', 'update'],
        },
        {
          definition: Role,
          allowedApis: [],
        },
        {
          definition: Permission,
          allowedApis: [],
        },
        {
          definition: CartItem,
          allowedApis: ['remove'],
        },
        {
          definition: CartShopItem,
          allowedApis: [],
        },
        {
          definition: Cart,
          allowedApis: ['findAll', 'paginate'],
        },

        // Media,
        // Auction,
        // AuctionBiddingHistory,
      ],

      providers: [
        FirebaseService,
        ProductResolver,
        ProductService,
        ProductHook,
      ],
      contextDecorator: Ctx,
    }),
    JwtModule.register({
      global: true,
      secret: 'rvGx7efcLKUVL6uK8MgR7X6cpFLUP9vg',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AppController],
  providers: [AppService, AuthResolver, RoleGuard],
})
export class AppModule {}
