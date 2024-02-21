import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { DryerModule } from 'dryerjs';
import { FirebaseModule } from 'nestjs-firebase';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Permission, Role, Session } from './auth/auth.definition';
import { AuthModule } from './auth/auth.module';
import { Ctx } from './auth/ctx';
import { configuration } from './config';
import { FirebaseService } from './firebase/firebase.serivce';
import { Categories } from './orthersDef/categories.definition';
import { TagWithValues } from './orthersDef/tagValues.definition';
import { Tags } from './orthersDef/tags.definition';
import { Product } from './product/product.definition';
import { ProductResolver } from './product/product.resolver';
import { ProductService } from './product/product.service';
import { CartItem } from './cart/definition/cartItem.definiton';
import { CartShopItem } from './cart/definition/cartShopItem.definition';
import { Cart } from './cart/definition/cart.definition';
import { CartResolver } from './cart/cart.resolver';
import { GatewayModule } from './gateway/gateway.module';
import { ProductHook } from './product/product.hooks';
import { User } from './user/user.definition';
import { UserService } from './user/user.service';
import { UserResolver } from './user/user.resolver';
import { Wallet } from './wallet/wallet.definition';
import { CartService } from './cart/cart.service';
import { EventEmitHook } from './hooks/event.hook';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { WalletService } from './wallet/wallet.service';

console.log({ nod: configuration().NODE_ENV });
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: configuration().NODE_ENV === 'dev' ? 'schema.gql' : true,
      playground: true,

      context: ({ req, res }) => ({ req, res }),
    }),
    MongooseModule.forRoot(
      'mongodb+srv://admin:fng8LrZdG2BqKbh2@clusterqueue.knjjwp9.mongodb.net/OrchidSample?retryWrites=true&w=majority',
    ),
    FirebaseModule.forRoot({
      googleApplicationCredential: './src/firebase/service-account.json',
    }),
    GatewayModule,
    EventEmitterModule.forRoot(),
    DryerModule.register({
      definitions: [
        {
          definition: Product,
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
          allowedApis: ['findAll', 'findOne', 'update', 'bulkRemove'],
        },
        {
          definition: Role,
          allowedApis: ['findAll', 'findOne', 'create', 'update', 'remove'],
        },
        {
          definition: Permission,
          allowedApis: ['findAll', 'findOne', 'create', 'update', 'remove'],
        },
        {
          definition: Session,
          allowedApis: ['findAll', 'findOne', 'create', 'update', 'remove'],
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
        {
          definition: Wallet,
          allowedApis: ['findOne', 'create', 'update'],
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
        CartResolver,
        EventEmitHook,
        UserService,
        UserResolver,
        CartService,
        CartResolver,
        WalletService,
      ],
      contextDecorator: Ctx,
    }),
    JwtModule.register({
      global: true,
      secret: 'rvGx7efcLKUVL6uK8MgR7X6cpFLUP9vg',
      signOptions: { expiresIn: '7d' },
    }),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
