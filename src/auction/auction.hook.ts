import { Injectable, UnauthorizedException } from '@nestjs/common';
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
  BeforeFindManyHook,
  BeforeFindManyHookInput,
  InjectBaseService,
  ObjectId,
} from 'dryerjs';
import {
  Auction,
  AuctionBiddingHistory,
  AuctionStatus,
} from './auction.definition';
import { Context } from 'src/auth/ctx';
import { User } from 'src/user/user.definition';
import { Product, ProductStatus } from 'src/product/product.definition';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationEvent } from 'src/notification/notification.service';
import { createNotification } from 'src/notification/notification.resolver';
import { NotificationTypeEnum } from 'src/notification/notification.definition';
import { Order } from 'src/order/definition/order.definition';
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
    @InjectBaseService(Order)
    public orderService: BaseService<Order, {}>,
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
        await this.auctionService.update(
          {},
          {
            id: updated.id,
            currentPrice: lastestBidding.bidPrice,
            winnerId: winner.id,
          },
        );

        const updatedProduct = await this.productService.update(
          {},
          {
            id: updated.productId,
            status: ProductStatus.SOLD,
          },
        );

        // TODO: Please help me
        // this.orderService.create(
        //   {},
        //   {
        //     addressFrom: updatedProduct.author.address[0].city,
        //     addressTo: winner.address[0].city,
        //     authorId: updatedProduct.authorId,
        //   },
        // );

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
    return updated;
  }
}
