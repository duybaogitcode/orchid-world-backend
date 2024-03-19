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
import { UserSubscription } from 'src/subscription/subscription.definition';
import { EventGateway } from 'src/gateway/event.gateway';
import { Wallet } from 'src/wallet/wallet.definition';
import { TransactionEventEnum } from 'src/wallet/event/transaction.event';
import { TransactionType } from 'src/wallet/transaction.definition';
import { SystemWalletEventEnum } from 'src/wallet/event/system.wallet.event';
import { ServiceProvider } from 'src/payment/payment.definition';

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
    @InjectBaseService(Wallet)
    private readonly walletService: BaseService<Wallet, {}>,
    private readonly agendaService: AgendaQueue,
    private readonly eventEmiter: EventEmitter2,
    private readonly socketEmitter: EventGateway,
  ) {}

  async findOneByProductSlug(productSlug: string) {
    const product = await this.productService.model.findOne({
      slug: productSlug,
      $or: [
        {
          status: ProductStatus.APPROVED,
        },
        {
          status: ProductStatus.SOLD,
        },
      ],
    });
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
    const session = await this.auctionService.model.db.startSession();
    session.startTransaction();
    try {
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
        {
          session,
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

      // Get 2% of initial price as a cost for system.
      const cost = auction.initialPrice * 0.02;
      const userWallet = await this.walletService.model.findOne({
        authorId: new ObjectId(userId),
      });

      if (userWallet.balance < cost) {
        throw new GraphQLError('Not enough balance');
      }

      userWallet.balance -= cost;

      await userWallet.save({ session });

      setTimeout(() => {
        this.eventEmiter.emit(TransactionEventEnum.CREATED, {
          input: {
            message: `Thu phí tham giá đấu giá 2%: ${cost}đ`,
            amount: cost,
            type: TransactionType.DECREASE,
            walletId: userWallet._id,
          },
        });
      }, 3000);

      setTimeout(() => {
        this.eventEmiter.emit(SystemWalletEventEnum.CREATED, {
          input: {
            amount: cost,
            type: TransactionType.INCREASE,
            walletId: userWallet._id,
            logs: '',
            serviceProvider: ServiceProvider.vnpay,
            isTopUpOrWithdraw: false,
          },
        });
      }, 3000);

      await session.commitTransaction();
      session.endSession();

      return auction;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
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
    console.log({ auctionBEforeInitial: auction?.initialPrice });
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
            href: '/auctions/' + auction?.id,
            message: `Buổi đấu giá *${product?.name}* đã được duyệt. Bạn sẽ tự động bắt đầu vào lúc **${moment(auction.startAt).utcOffset(7).format('YYYY-MM-DD HH:mm:ss')}**.`,
            receiver: auction.authorId,
            notificationType: NotificationTypeEnum.AUCTION,
          }),
        );
      } else {
        this.eventEmiter.emit(
          NotificationEvent.SEND,
          createNotification({
            href: '/auctions/' + auction?.id,
            message: `Buổi đấu giá *${product?.name}* đã được duyệt. Bạn có thể bắt đầu buổi đấu giá bất cứ lúc nào.`,
            receiver: auction.authorId,
            notificationType: NotificationTypeEnum.AUCTION,
          }),
        );
      }

      this.eventEmiter.emit('auction:force-refresh', {});

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

    this.socketEmitter.emitTo(started.id, 'auction:force-refresh', {});
    // Setup agenda job for auction expiration
    await this.agendaExpirationJob(auctionId, expireAt);

    // Notify to all participants
    auction.participantIds
      .concat([auction.authorId])
      .forEach((participantId) => {
        this.eventEmiter.emit(
          NotificationEvent.SEND,
          createNotification({
            href: '/auctions/' + started?.id,
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
        this.socketEmitter.emitTo(auctionId, 'auction:force-refresh', {});
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
                href: `/auctions/${updated?.id}`,
                message: `Đấu giá ${updatedProduct.name} đã kết thúc. Sản phẩm đã được bán với giá ${lastestBidding.bidPrice} đồng, vui lòng liên hệ với người bán để hoàn tất giao dịch`,
                notificationType: NotificationTypeEnum.AUCTION,
                receiver: lastestBidding.authorId,
              }),
            );

            this.eventEmiter.emit(
              NotificationEvent.SEND,
              createNotification({
                href: `/auctions/${updated?.id}`,
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
                    href: `/auctions/${updated?.id}`,
                    message: `Đấu giá ${updatedProduct.name} đã kết thúc. Sản phẩm đã được bán với giá ${lastestBidding.bidPrice} đồng, người chiến thắng là ${winner?.firstName || 'Anonymous'} ${winner?.lastName || 'Anonymous'}`,
                    notificationType: NotificationTypeEnum.AUCTION,
                    receiver: participantId,
                  }),
                );
              });
          } else {
            console.log('No winner');
            // Unlock funds for all participants, except the winner
            this.unlockFundsForParticipants(updated);
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

  unlockFundsForParticipants(auction: Auction) {
    auction.participantIds.map((participantId) => {
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
                href: '/auctions/' + auction?.id,
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

  async cancelExpirationJob(auctionId: ObjectId) {
    const agenda = await this.agendaService.getAgenda();
    agenda.cancel({ name: 'auction:expiration', 'data.auctionId': auctionId });
  }

  async stopAuction(auctionId: ObjectId, reason?: string) {
    console.log('🚀 ~ AuctionService ~ stopAuction ~ reason:', reason);
    const auction = await this.auctionService.model.findById(auctionId);

    auction.status = AuctionStatus.CANCELLED;
    auction.cancelReason = reason;
    auction.cancelAt = moment().utcOffset(7).toDate();
    await auction.save();

    // Cancel expiration job
    const resultExpiration = await this.cancelExpirationJob(auctionId);
    console.log(
      '🚀 ~ AuctionService ~ stopAuction ~ resultExpiration:',
      resultExpiration,
    );

    // Unlock funds for all participants
    console.log('STEP: unlockFundsForParticipants');
    this.unlockFundsForParticipants(auction);

    console.log('STEP: emit notifications for participants and author');
    auction.participantIds.map((participantId) => {
      this.eventEmiter.emit(
        NotificationEvent.SEND,
        createNotification({
          href: '/auctions/' + auction?.id,
          message: `Buổi đấu giá *${auction.productId}* đã bị hủy.`,
          receiver: participantId,
          notificationType: NotificationTypeEnum.AUCTION,
        }),
      );
    });

    this.eventEmiter.emit(
      NotificationEvent.SEND,
      createNotification({
        href: '/auctions/' + auction?.id,
        message: `Buổi đấu giá *${auction.productId}* đã bị hủy.`,
        receiver: auction.authorId,
        notificationType: NotificationTypeEnum.AUCTION,
      }),
    );

    return auction;
  }
}
