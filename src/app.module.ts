import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { GraphQLModule } from '@nestjs/graphql';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import * as redisStore from 'cache-manager-ioredis';
import { DryerModule } from 'dryerjs';
import { FirebaseModule } from 'nestjs-firebase';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Permission, Role, Session } from './auth/auth.definition';
import { AuthModule } from './auth/auth.module';
import { Ctx } from './auth/ctx';
import { CartResolver } from './cart/cart.resolver';
import { Cart } from './cart/definition/cart.definition';
import { CartItem } from './cart/definition/cartItem.definiton';
import { CartShopItem } from './cart/definition/cartShopItem.definition';
import { CartService } from './cart/services/cart.service';
import { CartItemService } from './cart/services/cartItem.service';
import { CartIShopItemService } from './cart/services/cartItemShop.service';
import { configuration } from './config';
import { CartEvent } from './event/cart.event';
import { FirebaseService } from './firebase/firebase.serivce';
import { GatewayModule } from './gateway/gateway.module';
import { Admin, UserOnly } from './guard/roles.guard';
import { EventEmitHook } from './hooks/event.hook';
import { Order } from './order/definition/order.definition';
import { OrderTransaction } from './order/definition/orderTransaction.definition';
import { OrderEvent } from './order/event/order.event';
import { OrderTransactionEvent } from './order/event/orderTransaction.event';
import { OrderTransactionResolver } from './order/order.resolver';
import { OrderTransactionService } from './order/service.ts/order.service';
import { Categories } from './orthersDef/categories.definition';
import { TagWithValues } from './orthersDef/tagValues.definition';
import { Tags } from './orthersDef/tags.definition';
import { PaymentModule } from './payment/payment.module';
import { ProductEvent } from './product/event/product.event';
import { Product } from './product/product.definition';
import { ProductHook } from './product/product.hooks';
import { ProductResolver } from './product/product.resolver';
import { ProductService } from './product/product.service';
import { User } from './user/user.definition';
import { UserResolver } from './user/user.resolver';
import { UserService } from './user/user.service';
import { TransactionEvent } from './wallet/event/transaction.event';
import { WalletEvent } from './wallet/event/wallet.event';
import { Transaction } from './wallet/transaction.definition';
import { TransactionResolver } from './wallet/transaction.resolver';
import { TransactionService } from './wallet/transaction.service';
import { Wallet } from './wallet/wallet.definition';
import { WalletService } from './wallet/wallet.service';
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
    PaymentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
