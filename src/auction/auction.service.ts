import { BaseService, InjectBaseService, ObjectId } from 'dryerjs';
import {
  Auction,
  AuctionBiddingHistory,
  AuctionStatus,
} from './auction.definition';
import { Product, ProductStatus } from 'src/product/product.definition';
import { User } from 'src/user/user.definition';
import * as moment from 'moment';
import { AgendaQueue, JobPriority } from 'src/queue/agenda.queue';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { NotificationEvent } from 'src/notification/notification.service';
import { createNotification } from 'src/notification/notification.resolver';
import { NotificationTypeEnum } from 'src/notification/notification.definition';
import { GraphQLError } from 'graphql';
import { WalletEvent } from 'src/wallet/event/wallet.event';
import { WalletEventPayload, WalletEvents } from 'src/wallet/wallet.service';
import { OrderEventEnum } from 'src/order/event/order.event';

export const AuctionEvents = {
  AUCTION_START: 'AUCTION_START',
  AUCTION_EXPIRE: 'AUCTION_EXPIRE',
  AUCTION_COMPLETE: 'AUCTION_COMPLETE',
  AUCTION_BID: 'AUCTION_BID',
};

export const AuctionEventPayload = {
  getStartPayload: (payload: { auctionId: ObjectId }) => {
    return {
      event: AuctionEvents.AUCTION_START,
      payload,
    };
  },
  getExpirePayload: (payload: { auctionId: ObjectId }) => {
    return {
      event: AuctionEvents.AUCTION_EXPIRE,
      payload,
    };
  },
  getCompletePayload: (payload: { auctionId: ObjectId }) => {
    return {
      event: AuctionEvents.AUCTION_COMPLETE,
      payload,
    };
  },
  getBidPayload: (payload: {
    auctionId: ObjectId;
    authorId: ObjectId;
    amount: number;
  }) => {
    return {
      event: AuctionEvents.AUCTION_BID,
      payload,
    };
  },
};
export class AuctionService {
  constructor(
    @InjectBaseService(Auction)
    private readonly auctionService: BaseService<Auction, {}>,
    @InjectBaseService(User)
    private readonly userService: BaseService<User, {}>,
    @InjectBaseService(Product)
    private readonly productService: BaseService<Product, {}>,
    @InjectBaseService(AuctionBiddingHistory)
    private readonly biddingHistoryService: BaseService<
      AuctionBiddingHistory,
      {}
    >,
    private readonly agendaService: AgendaQueue,
    private readonly eventEmiter: EventEmitter2,
  ) {}

  async findOneByProductSlug(productSlug: string) {
    const product = await this.productService.findOne(
      {},
      { slug: productSlug, status: ProductStatus.APPROVED },
    );
    return this.auctionService.findOne({}, { productId: product.id });
  }

  async isUserParticipatingInAuction(auction: Auction, userId: ObjectId) {
    return auction.participantIds.includes(userId);
  }

  async doesUserAreOwnerOfAuction(auction: Auction, userId: ObjectId) {
    return auction.authorId === userId;
  }

  async isAuctionAvailableForRegister(auction: Auction) {
    return auction?.status === AuctionStatus.APPROVED;
  }

  async checkAuctionValidityBeforeRegistration(
    auctionId: ObjectId,
    userId: ObjectId,
  ) {
    console.log({ auctionId, userId });
    const auction = await this.auctionService.findById({}, { _id: auctionId });
    console.log({ auction });
    if (!auction) {
      throw new GraphQLError('Auction not found');
    }

    if (await this.isUserParticipatingInAuction(auction, userId)) {
      throw new GraphQLError('You are already participating in this auction');
    }

    if (await this.doesUserAreOwnerOfAuction(auction, userId)) {
      throw new GraphQLError('You cannot participate in your own auction');
    }

    if (!(await this.isAuctionAvailableForRegister(auction))) {
      throw new GraphQLError('Auction is not available for register');
    }
  }

  async checkAuctionValidityBeforeUnregistration(
    auctionId: ObjectId,
    userId: ObjectId,
  ) {
    const auction = await this.auctionService.findById({}, { _id: auctionId });
    if (!auction) {
      throw new GraphQLError('Auction not found');
    }

    if (!(await this.isUserParticipatingInAuction(auction, userId))) {
      throw new GraphQLError('You are not participating in this auction');
    }

    if (await this.doesUserAreOwnerOfAuction(auction, userId)) {
      throw new GraphQLError('You cannot unregister from your own auction');
    }

    if (!(await this.isAuctionAvailableForRegister(auction))) {
      throw new GraphQLError('Auction is not available for unregister ');
    }
  }

  async registerAuction(auctionId: ObjectId, userId: ObjectId) {
    // TODO: validate user's wallet before bidding

    const user = await this.userService.model.findById(new ObjectId(userId));
    if (!user) {
      throw new GraphQLError('User not found');
    }
    if (!user?.phone) {
      throw new GraphQLError('User has not phone number');
    }

    await this.checkAuctionValidityBeforeRegistration(auctionId, userId);
    const auction = await this.auctionService.model.findOneAndUpdate(
      {
        _id: auctionId,
      },
      {
        $push: {
          participantIds: userId,
        },
        $inc: {
          totalParticipants: 1,
        },
      },
    );

    // Lock funds
    this.eventEmiter.emit(
      WalletEvents.LOCK_FUNDS,
      WalletEventPayload.getLockFundsPayload({
        payload: {
          authorId: userId,
          amount: auction.initialPrice,
        },
      }),
    );

    return auction;
  }

  async unregisterAuction(auctionId: ObjectId, userId: ObjectId) {
    await this.checkAuctionValidityBeforeUnregistration(auctionId, userId);

    const auction = await this.auctionService.model.findOneAndUpdate(
      {
        _id: auctionId,
      },
      {
        $pull: {
          participantIds: userId,
        },
        $inc: {
          totalParticipants: -1,
        },
      },
    );

    // Unlock funds
    this.eventEmiter.emit(
      WalletEvents.UNLOCK_FUNDS,
      WalletEventPayload.getUnlockFundsPayload({
        payload: {
          authorId: userId,
          amount: auction.initialPrice,
        },
      }),
    );

    return auction;
  }

  async;

  async approveAuction(auctionId: ObjectId) {
    try {
      const auction = await this.auctionService.update(
        {},
        {
          id: auctionId,
          status: AuctionStatus.APPROVED,
        },
      );

      const product = await this.productService.findById(
        {},
        { _id: auction.productId },
      );

      if (auction.startAutomatically && auction.startAt) {
        await this.startAuction(auctionId, auction.status);
        this.eventEmiter.emit(
          NotificationEvent.SEND,
          createNotification({
            href: '/auctions/' + product?.slug,
            message: `Buổi đấu giá *${product?.name}* đã được duyệt. Bạn sẽ tự động bắt đầu vào lúc **${moment(auction.startAt).utcOffset(7).format('YYYY-MM-DD HH:mm:ss')}**.`,
            receiver: auction.authorId,
            notificationType: NotificationTypeEnum.AUCTION,
          }),
        );
      } else {
        this.eventEmiter.emit(
          NotificationEvent.SEND,
          createNotification({
            href: '/auctions/' + product?.slug,
            message: `Buổi đấu giá *${product?.name}* đã được duyệt. Bạn có thể bắt đầu buổi đấu giá bất cứ lúc nào.`,
            receiver: auction.authorId,
            notificationType: NotificationTypeEnum.AUCTION,
          }),
        );
      }

      return true;
    } catch (error) {
      console.log({ error });
    }
  }

  @OnEvent(AuctionEvents.AUCTION_START)
  async startAuctionEvent({ payload }: { payload: { auctionId: ObjectId } }) {
    await this.startAuction(payload.auctionId);
  }

  async startAuction(auctionId: ObjectId, auctionStatus?: AuctionStatus) {
    console.log({ auctionId, auctionStatus });
    const auction = await this.auctionService.findById({}, { _id: auctionId });
    const product = await this.productService.findById(
      {},
      { _id: auction.productId },
    );

    if (
      auction.status !== AuctionStatus.APPROVED &&
      auctionStatus !== AuctionStatus.APPROVED
    ) {
      throw new GraphQLError('Auction is not available for start');
    }

    const utc = moment(auction.startAt).utcOffset(7).toDate();
    const duration = auction.duration;
    const durationUnit = auction.durationUnit;

    const startAt = moment(utc).set({ second: 0 }).toDate();
    const expireAt = moment(utc)
      .add(duration, durationUnit)
      .set({ second: 0 })
      .toDate();

    const formatedStartAt = moment(startAt).format('YYYY-MM-DD HH:mm:ss');
    const formatedExpireAt = moment(expireAt).format('YYYY-MM-DD HH:mm:ss');

    console.log({
      formatedStartAt,
      duration,
      durationUnit,
      formatedExpireAt,
      expireAt,
    });

    // If auction start automatically, setup agenda job for auction start
    if (auction.startAutomatically && startAt) {
      // Update auction status to running
      const started = await this.auctionService.update(
        {},
        {
          id: auctionId,
          startAt: startAt,
          expireAt: expireAt,
        },
      );

      await this.agendaAutoStartAuction(auctionId, startAt, expireAt);
      await this.agendaNotifyBeforeStart(auctionId, startAt);
      return started;
    }

    // Update auction status to running
    const started = await this.auctionService.model.findOneAndUpdate(
      {
        _id: auctionId,
      },
      {
        status: AuctionStatus.RUNNING,
        startAt: startAt,
        expireAt: expireAt,
      },
    );

    // Setup agenda job for auction expiration
    await this.agendaExpirationJob(auctionId, expireAt);

    // Notify to all participants
    auction.participantIds
      .concat([auction.authorId])
      .forEach((participantId) => {
        this.eventEmiter.emit(
          NotificationEvent.SEND,
          createNotification({
            href: '/auctions/' + product?.slug,
            message: `Buổi đấu giá *${product?.name}* đã bắt đầu lúc **${formatedStartAt}** và sẽ kết thúc lúc **${formatedExpireAt}**. Hãy chuẩn bị sẵn sàng để tham gia đấu giá nhé.`,
            receiver: participantId,
            notificationType: NotificationTypeEnum.AUCTION,
          }),
        );
      });

    return started;
  }

  async agendaAutoStartAuction(
    auctionId: ObjectId,
    startAt: Date,
    expireAt: Date,
  ) {
    const agenda = await this.agendaService.getAgenda();
    agenda.define(
      'auction:start',
      {
        concurrency: 20,
        priority: JobPriority?.highest,
      },
      async (job) => {
        const auctionId = job.attrs.data?.auctionId;
        const _startAt = job.attrs.data?.startAt;
        const _expireAt = job.attrs.data?.expireAt;
        console.log('Auction start', job.attrs.data);
        console.log({ at: moment().format('YYYY-MM-DD HH:mm:ss') });
        await this.auctionService.model.findOneAndUpdate(
          {
            _id: auctionId,
          },
          {
            status: AuctionStatus.RUNNING,
            startAt: _startAt,
            expireAt: _expireAt,
          },
        );
        await this.agendaExpirationJob(auctionId, _expireAt);
      },
    );

    await agenda.start();
    await agenda.schedule(startAt, 'auction:start', {
      auctionId: auctionId,
      startAt: startAt,
      expireAt: expireAt,
    });
  }

  async agendaExpirationJob(auctionId: ObjectId, expireAt: Date) {
    const agenda = await this.agendaService.getAgenda();
    agenda.define(
      'auction:expiration',
      {
        concurrency: 20,
        priority: JobPriority?.highest,
      },
      async (job) => {
        const auctionId = job.attrs.data?.auctionId;
        console.log('Auction expired', job.attrs.data);
        console.log({ at: moment().format('YYYY-MM-DD HH:mm:ss') });
        const updated = await this.auctionService.model.findOneAndUpdate(
          {
            _id: auctionId,
          },
          {
            status: AuctionStatus.COMPLETED,
          },
        );

        const session = await this.productService.model.db.startSession();
        session.startTransaction();
        try {
          const lastestBidding = await this.biddingHistoryService.model.findOne(
            { auctionId: updated.id },
            { bidPrice: 1, authorId: 1 },
            {
              sort: {
                createdAt: -1,
              },
            },
          );
          console.log({ lastestBidding });
          if (lastestBidding) {
            const winner = await this.userService.findById(
              {},
              {
                _id: lastestBidding.authorId,
              },
            );

            const auction = await this.auctionService.model.findById(
              updated.id,
            );
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
                this.eventEmiter.emit(
                  WalletEvents.UNLOCK_FUNDS,
                  WalletEventPayload.getUnlockFundsPayload({
                    payload: {
                      authorId: participantId,
                      amount: auction.initialPrice,
                    },
                  }),
                );
              });

            this.eventEmiter.emit(OrderEventEnum.CREATE_BY_AUCTION, {
              winner: winner,
              updatedProduct: updatedProduct,
              lastestBidding: lastestBidding,
              auction: auction,
            });

            this.eventEmiter.emit(
              NotificationEvent.SEND,
              createNotification({
                href: `/auctions/${updatedProduct.slug}`,
                message: `Đấu giá ${updatedProduct.name} đã kết thúc. Sản phẩm đã được bán với giá ${lastestBidding.bidPrice} đồng, vui lòng liên hệ với người bán để hoàn tất giao dịch`,
                notificationType: NotificationTypeEnum.AUCTION,
                receiver: lastestBidding.authorId,
              }),
            );

            this.eventEmiter.emit(
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
                this.eventEmiter.emit(
                  NotificationEvent.SEND,
                  createNotification({
                    href: `/auctions/${updatedProduct.slug}`,
                    message: `Đấu giá ${updatedProduct.name} đã kết thúc. Sản phẩm đã được bán với giá ${lastestBidding.bidPrice} đồng, người chiến thắng là ${winner?.firstName || 'Anonymous'} ${winner?.lastName || 'Anonymous'}`,
                    notificationType: NotificationTypeEnum.AUCTION,
                    receiver: participantId,
                  }),
                );
              });
          } else {
            console.log('No winner');
            // Unlock funds for all participants, except the winner
            updated.participantIds.map((participantId) => {
              this.eventEmiter.emit(
                WalletEvents.UNLOCK_FUNDS,
                WalletEventPayload.getUnlockFundsPayload({
                  payload: {
                    authorId: participantId,
                    amount: updated.initialPrice,
                  },
                }),
              );
            });
          }

          await session.commitTransaction();
          session.endSession();
        } catch (error) {
          await session.abortTransaction();
          session.endSession();
        }
      },
    );
    await agenda.start();
    await agenda.schedule(expireAt, 'auction:expiration', {
      auctionId: auctionId,
    });
  }

  async agendaNotifyBeforeStart(auctionId: ObjectId, startAt: Date) {
    const agenda = await this.agendaService.getAgenda();
    agenda.define(
      'auction:notify-before-start',
      {
        concurrency: 20,
        priority: JobPriority?.highest,
      },
      async (job) => {
        const auctionId = job.attrs.data?.auctionId;
        console.log('auction:notify-before-start', job.attrs.data);
        console.log({ at: moment().format('YYYY-MM-DD HH:mm:ss') });
        const auction = await this.auctionService.findById(
          {},
          { _id: auctionId },
        );
        const product = await this.productService.findById(
          {},
          { _id: auction.productId },
        );

        auction.participantIds
          .concat([auction.authorId])
          .forEach((participantId) => {
            this.eventEmiter.emit(
              NotificationEvent.SEND,
              createNotification({
                href: '/auctions/' + product?.slug,
                message: `Buổi đấu giá *${product?.name}* sẽ bắt đầu lúc **${moment(
                  startAt,
                )
                  .utcOffset(7)
                  .format(
                    'YYYY-MM-DD HH:mm:ss',
                  )}**. Hãy chuẩn bị sẵn sàng để tham gia đấu giá nhé.`,
                receiver: participantId,
                notificationType: NotificationTypeEnum.AUCTION,
              }),
            );
          });
      },
    );
    await agenda.start();
    const notifyBeforeStart = moment(startAt).isAfter(
      moment(startAt).subtract(5, 'minutes'),
    )
      ? moment().toDate()
      : moment(startAt).subtract(5, 'minutes').toDate();
    await agenda.schedule(notifyBeforeStart, 'auction:notify-before-start', {
      auctionId: auctionId,
    });
  }

  async stopAuction(auctionId: ObjectId) {
    const auction = await this.auctionService.model.findById(auctionId);

    auction.status = AuctionStatus.CANCELLED;

    await auction.save();

    auction.participantIds.map((participantId) => {
      this.eventEmiter.emit(
        NotificationEvent.SEND,
        createNotification({
          href: '/auctions/' + auction.productId,
          message: `Buổi đấu giá *${auction.productId}* đã bị hủy.`,
          receiver: participantId,
          notificationType: NotificationTypeEnum.AUCTION,
        }),
      );
    });

    return auction;
  }
}
