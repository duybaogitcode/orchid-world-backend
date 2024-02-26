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
import { CartService } from './cart/services/cart.service';
import { EventEmitHook } from './hooks/event.hook';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { WalletService } from './wallet/wallet.service';
import * as redisStore from 'cache-manager-ioredis';
import { CacheModule } from '@nestjs/cache-manager';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { CartItemService } from './cart/services/cartItem.service';
import { CartIShopItemService } from './cart/services/cartItemShop.service';
import { Admin, ShopOnly, ShopOrUserOnly, UserOnly } from './guard/roles.guard';
import { CartEvent } from './event/cart.event';
import { Transaction } from './wallet/transaction.definition';
import { TransactionService } from './wallet/transaction.service';
import { TransactionResolver } from './wallet/transaction.resolver';
import { OrderTransactionResolver } from './order/order.resolver';
import { OrderTransactionService } from './order/service.ts/order.service';
import { OrderTransaction } from './order/definition/orderTransaction.definition';
import { Order } from './order/definition/order.definition';
import { TransactionEvent } from './wallet/event/transaction.event';
import { OrderEvent } from './order/event/order.event';
import { OrderTransactionEvent } from './order/event/orderTransaction.event';
import { WalletEvent } from './wallet/event/wallet.event';
import { ProductEvent } from './product/event/product.event';

console.log({ nod: configuration().NODE_ENV });
@Module({
  imports: [
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: configuration().NODE_ENV === 'dev' ? 'schema.gql' : true,
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault()],
      context: ({ req, res }) => ({ req, res }),
      installSubscriptionHandlers: true,
      subscriptions: {
        'graphql-ws': true,
      },
    }),
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: 'redis-11152.c323.us-east-1-2.ec2.cloud.redislabs.com',
      port: 11152,
      username: 'default',
      password: 'hwHMty4zzVV9hes1qGiEPqqDTt1nrlZo',
      ttl: 3600,
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
          embeddedConfigs: [
            {
              property: 'shopOwner',
              allowedApis: [],
            },
          ],
          allowedApis: ['findAll', 'paginate'],
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
          decorators: {
            findOne: [UserOnly()],
            findAll: [Admin()],
            bulkRemove: [Admin()],
          },
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
          allowedApis: [],
        },
        {
          definition: CartShopItem,
          allowedApis: [],
        },
        {
          definition: Cart,
          allowedApis: ['findAll', 'findOne'],
        },
        {
          definition: Wallet,
          allowedApis: ['findOne', 'create', 'update', 'remove'],
        },
        {
          definition: Order,
          allowedApis: ['findAll'],
        },
        {
          definition: OrderTransaction,

          allowedApis: [],
        },

        {
          definition: Transaction,
          allowedApis: [
            'findOne',
            'create',
            'update',
            'remove',
            'findAll',
            'paginate',
            'essentials',
          ],
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
        CartItemService,
        CartIShopItemService,
        CartResolver,
        WalletService,
        CartEvent,
        TransactionResolver,
        TransactionService,
        OrderTransactionResolver,
        OrderTransactionService,
        TransactionEvent,
        OrderEvent,
        OrderTransactionEvent,
        WalletEvent,
        ProductEvent,
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
