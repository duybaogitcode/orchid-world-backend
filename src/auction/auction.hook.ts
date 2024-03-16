import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  AfterCreateHook,
  AfterCreateHookInput,
  AfterFindManyHook,
  AfterFindManyHookInput,
  AfterUpdateHook,
  AfterUpdateHookInput,
  BaseService,
  BeforeCreateHook,
  BeforeCreateHookInput,
  InjectBaseService,
  ObjectId,
} from 'dryerjs';
import { Context } from 'src/auth/ctx';
import { NotificationTypeEnum } from 'src/notification/notification.definition';
import { createNotification } from 'src/notification/notification.resolver';
import { NotificationEvent } from 'src/notification/notification.service';
import { OrderEventEnum } from 'src/order/event/order.event';
import { Product, ProductStatus } from 'src/product/product.definition';
import { User } from 'src/user/user.definition';
import {
  Auction,
  AuctionBiddingHistory,
  AuctionStatus,
} from './auction.definition';
import { WalletEventPayload, WalletEvents } from 'src/wallet/wallet.service';
import { AuctionEventPayload, AuctionEvents } from './auction.service';
import { UserSubscription } from 'src/subscription/subscription.definition';
import {
  SubscriptionEvents,
  SubscriptionPayload,
} from 'src/subscription/subscription.service';

@Injectable()
export class AuctionHook {
  constructor(
    @InjectBaseService(Auction)
    public auctionService: BaseService<Auction, {}>,
    @InjectBaseService(User)
    public userService: BaseService<User, {}>,
    @InjectBaseService(AuctionBiddingHistory)
    public biddingHistoryService: BaseService<AuctionBiddingHistory, {}>,
    @InjectBaseService(Product)
    public productService: BaseService<Product, {}>,
    @InjectBaseService(UserSubscription)
    private readonly userSubscriptionService: BaseService<UserSubscription, {}>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @BeforeCreateHook(() => Auction)
  async beforeCreateAuction({
    input,
    ctx,
  }: BeforeCreateHookInput<Auction, Context>) {
    if (ctx === null) {
      throw new UnauthorizedException();
    }

    const existAuction = await this.auctionService.findOneNullable(
      {},
      {
        productId: input.productId,
        status: {
          $in: [
            AuctionStatus.APPROVED,
            AuctionStatus.COMPLETED,
            AuctionStatus.RUNNING,
          ],
        },
      },
    );

    if (existAuction) {
      throw new Error('Product has been auctioned');
    }

    const userSubscription = await this.userSubscriptionService.findOne(
      {},
      {
        userId: new ObjectId(ctx.id),
      },
    );

    if (!userSubscription) {
      throw new BadRequestException(
        'User must have subscription to create an auction',
      );
    }

    input.authorId = new ObjectId(ctx.id);
    input.currentPrice = input?.initialPrice || 0;
  }

  @AfterCreateHook(() => Auction)
  afterCreateAuction({ created }: AfterCreateHookInput<Auction, Context>) {
    const sentEvent = this.eventEmitter.emit(
      SubscriptionEvents.MINUS_ONE,
      SubscriptionPayload.getMinusOnePayload(created.authorId),
    );

    if (!sentEvent) {
      throw new InternalServerErrorException('Failed to emit event');
    }

    return created;
  }

  @AfterFindManyHook(() => Auction)
  afterFindManyAuction({ items }: AfterFindManyHookInput<Auction, Context>) {
    return items.filter((i) => i?.product && i?.productId);
  }

  @AfterUpdateHook(() => Auction)
  async afterUpdateAuction({
    updated,
  }: AfterUpdateHookInput<Auction, Context>) {
    const session = await this.productService.model.db.startSession();
    session.startTransaction();
    try {
      if (
        updated?.status === AuctionStatus.APPROVED &&
        updated.startAt &&
        !updated.expireAt &&
        updated.startAutomatically
      ) {
        this.eventEmitter.emit(
          AuctionEvents.AUCTION_START,
          AuctionEventPayload.getStartPayload({
            auctionId: updated.id,
          }),
        );
      }

      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
    }
  }
}
