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
import {
  Admin,
  AdminOrManager,
  AdminOrManagerOrStaff,
  ManagerOnly,
  ManagerOrStaff,
  ShopOnly,
  ShopOrUserOnly,
  UserOnly,
} from './guard/roles.guard';
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
import { PaypalService } from './payment/paypal.service';
import { ConfigModule } from '@nestjs/config';
import { ReportTypes } from './report/definition/reportTypes.definition';
import { ReportSolved } from './report/definition/reportSolved.definition';
import { Report } from './report/definition/report.definition';
import { Notification } from './notification/notification.definition';
import { NotificationService } from './notification/notification.service';
import { EventGateway } from './gateway/event.gateway';
import { ExchangePayment } from './payment/payment.definition';
import { PaymentService } from './payment/payment.service';
import { ExchangePaymentResolver } from './payment/payment.resolver';
import { NotificationResolver } from './notification/notification.resolver';
import { OrderEvidence } from './order/definition/orderEvidence.definition';
import { OrderIssues } from './order/definition/orderIssues.definition';
import { OrderEvidenceEvent } from './order/event/orderEvidence.event';
import {
  AuctionSubscription,
  UserSubscription,
} from './subscription/subscription.definition';
import { SubscriptionService } from './subscription/subscription.service';
import { SubscriptionResolver } from './subscription/subscription.resolver';
import { Auction, AuctionBiddingHistory } from './auction/auction.definition';
import { SystemWallet } from './wallet/systems/system.wallet.definition';
import { SystemTransaction } from './wallet/systems/system.transaction.definition';
import { SystemWalletEvent } from './wallet/event/system.wallet.event';
import { AuctionHook } from './auction/auction.hook';
import { AuctionService } from './auction/auction.service';
import { AuctionResolver } from './auction/auction.resolver';
import { MongoQuery } from './utils/mongoquery';
import { AgendaQueue } from './queue/agenda.queue';
import { BiddingResolver } from './auction/bidding.resolver';
import { BiddingService } from './auction/bidding.service';
import { GoShipService } from './utils/goship';
import { Feedbacks } from './feedbacks/feedbacks.definition';
import { FeedbackEvent } from './feedbacks/feedback.event';
import { FeedbackHook } from './feedbacks/feedback.hook';
import { Tasks } from './tasks/tasks.definition';
import { TasksHook } from './tasks/tasks.hook';
import { TaskResolver } from './tasks/task.resolver';
import { TasksService } from './tasks/task.service';

console.log({ nod: configuration().NODE_ENV });

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
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
          allowedApis: ['findAll', 'paginate', 'essentials', 'findOne'],
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
          allowedApis: [
            'findAll',
            'create',
            'update',
            'remove',
            'paginate',
            'essentials',
          ],
        },
        {
          definition: User,
          allowedApis: ['findAll', 'findOne', 'bulkRemove', 'update', 'create'],
          decorators: {
            findAll: [AdminOrManager()],
            create: [Admin()],
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
          allowedApis: ['findAll', 'paginate'],
          decorators: {
            findAll: [ManagerOrStaff()],
            paginate: [ManagerOrStaff()],
          },
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
        {
          definition: ReportTypes,
          allowedApis: ['create', 'findAll', 'findOne', 'update', 'remove'],
        },
        {
          definition: Report,
          allowedApis: ['findAll', 'findOne', 'remove', 'create', 'update'],
        },
        {
          definition: ReportSolved,
          allowedApis: ['create', 'findAll', 'findOne', 'update', 'remove'],
        },

        {
          definition: Notification,
          allowedApis: [
            'findAll',
            'findOne',
            'create',
            'update',
            'remove',
            'paginate',
            'essentials',
          ],
        },
        {
          definition: ExchangePayment,
          allowedApis: [],
        },

        {
          definition: OrderEvidence,
          allowedApis: [],
        },
        // {
        //   definition: OrderIssues,
        //   allowedApis: [],
        // },
        {
          definition: OrderIssues,
          allowedApis: [],
        },
        {
          definition: AuctionSubscription,
          allowedApis: [
            'findAll',
            'findOne',
            'create',
            'update',
            'remove',
            'paginate',
          ],
        },
        {
          definition: UserSubscription,
          allowedApis: ['findAll', 'findOne', 'create', 'update', 'remove'],
          decorators: {
            findAll: [Admin()],
            create: [UserOnly()],
            update: [UserOnly()],
            remove: [UserOnly()],
          },
        },
        {
          definition: Auction,
          allowedApis: [
            'findAll',
            'findOne',
            'create',
            'update',
            'remove',
            'paginate',
            'essentials',
          ],
          decorators: {
            create: [ShopOnly()],
            update: [ShopOrUserOnly()],
            remove: [ShopOnly()],
          },
        },

        {
          definition: SystemWallet,
          allowedApis: ['findOne', 'create', 'update', 'remove'],
        },

        {
          definition: SystemTransaction,
        },
        // Media,
        // Auction,
        {
          definition: AuctionBiddingHistory,
          allowedApis: ['findAll', 'findOne', 'remove', 'paginate'],
        },
        {
          definition: Feedbacks,
          allowedApis: ['findAll', 'findOne', 'remove', 'paginate', 'update'],
          decorators: {
            update: [ShopOrUserOnly()],
            remove: [ShopOrUserOnly()],
          },
        },

        {
          definition: Tasks,
          allowedApis: ['findAll', 'findOne', 'paginate', 'update', 'create'],
          decorators: {
            findAll: [AdminOrManagerOrStaff()],
            paginate: [AdminOrManagerOrStaff()],
            create: [AdminOrManager()],
            update: [AdminOrManagerOrStaff()],
            remove: [AdminOrManager()],
          },
        },
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
        PaypalService,
        NotificationService,
        EventGateway,
        PaymentService,
        ExchangePaymentResolver,
        NotificationResolver,
        OrderEvidenceEvent,
        SubscriptionService,
        SubscriptionResolver,
        SystemWalletEvent,
        AuctionHook,
        AuctionService,
        AuctionResolver,
        MongoQuery,
        AgendaQueue,
        BiddingResolver,
        BiddingService,
        FeedbackEvent,
        FeedbackHook,
        GoShipService,
        TasksHook,
        TaskResolver,
        TasksService,
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
  providers: [AppService, GoShipService],
})
export class AppModule {}
