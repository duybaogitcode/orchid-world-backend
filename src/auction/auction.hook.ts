import { Injectable, UnauthorizedException } from '@nestjs/common';
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

    input.authorId = new ObjectId(ctx.id);
    input.currentPrice = input?.initialPrice || 0;
  }

  @AfterCreateHook(() => Auction)
  afterCreateAuction({ created }: AfterCreateHookInput<Auction, Context>) {
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
      if (updated?.status === AuctionStatus.COMPLETED) {
        const lastestBidding = await this.biddingHistoryService.model.findOne(
          { auctionId: updated.id },
          { bidPrice: 1, authorId: 1 },
          {
            sort: {
              createdAt: -1,
            },
          },
        );

        if (lastestBidding) {
          const winner = await this.userService.findById(
            {},
            {
              _id: lastestBidding.authorId,
            },
          );

          const auction = await this.auctionService.model.findById(updated.id);
          auction.winnerId = winner.id;
          auction.currentPrice = lastestBidding.bidPrice;
          await auction.save({ session });

          const updatedProduct = await this.productService.model.findById(
            updated.productId,
          );

          updatedProduct.status = ProductStatus.SOLD;

          await updatedProduct.save({ session });

          // Unlock funds for all participants, except the winner
          auction.participantIds
            .filter((id) => id !== winner.id)
            .map((participantId) => {
              this.eventEmitter.emit(
                WalletEvents.UNLOCK_FUNDS,
                WalletEventPayload.getUnlockFundsPayload({
                  payload: {
                    authorId: participantId,
                    amount: auction.initialPrice,
                  },
                }),
              );
            });

          this.eventEmitter.emit(OrderEventEnum.CREATE_BY_AUCTION, {
            winner: winner,
            updatedProduct: updatedProduct,
            lastestBidding: lastestBidding,
            auction: auction,
          });

          this.eventEmitter.emit(
            NotificationEvent.SEND,
            createNotification({
              href: `/auctions/${updatedProduct.slug}`,
              message: `Đấu giá ${updatedProduct.name} đã kết thúc. Sản phẩm đã được bán với giá ${lastestBidding.bidPrice} đồng, vui lòng liên hệ với người bán để hoàn tất giao dịch`,
              notificationType: NotificationTypeEnum.AUCTION,
              receiver: lastestBidding.authorId,
            }),
          );

          this.eventEmitter.emit(
            NotificationEvent.SEND,
            createNotification({
              href: `/auctions/${updatedProduct.slug}`,
              message: `Đấu giá ${updatedProduct.name} đã kết thúc. Sản phẩm đã được bán với giá ${lastestBidding.bidPrice} đồng, người chiến thắng là ${winner?.firstName || 'Anonymous'} ${winner?.lastName || 'Anonymous'}. Vui lòng liên hệ với người mua để hoàn tất giao dịch`,
              notificationType: NotificationTypeEnum.AUCTION,
              receiver: updated.authorId,
            }),
          );

          updated.participantIds
            .filter((id) => id !== winner?.id)
            .map((participantId) => {
              this.eventEmitter.emit(
                NotificationEvent.SEND,
                createNotification({
                  href: `/auctions/${updatedProduct.slug}`,
                  message: `Đấu giá ${updatedProduct.name} đã kết thúc. Sản phẩm đã được bán với giá ${lastestBidding.bidPrice} đồng, người chiến thắng là ${winner?.firstName || 'Anonymous'} ${winner?.lastName || 'Anonymous'}`,
                  notificationType: NotificationTypeEnum.AUCTION,
                  receiver: participantId,
                }),
              );
            });
        }
      }

      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
    }
  }
}
