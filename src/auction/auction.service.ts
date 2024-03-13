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
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationEvent } from 'src/notification/notification.service';
import { createNotification } from 'src/notification/notification.resolver';
import { NotificationTypeEnum } from 'src/notification/notification.definition';
import { GraphQLError } from 'graphql';

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
    const user = await this.userService.model.findById(new ObjectId(userId));
    if (!user) {
      throw new GraphQLError('User not found');
    }
    if (!user?.phone) {
      throw new GraphQLError('User has not phone number');
    }

    await this.checkAuctionValidityBeforeRegistration(auctionId, userId);

    return this.auctionService.model.findOneAndUpdate(
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
  }

  async unregisterAuction(auctionId: ObjectId, userId: ObjectId) {
    await this.checkAuctionValidityBeforeUnregistration(auctionId, userId);

    return this.auctionService.model.findOneAndUpdate(
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

      if (auction.startAutomatically) {
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
    if (auction.startAutomatically) {
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
        await this.auctionService.model.findOneAndUpdate(
          {
            _id: auctionId,
          },
          {
            status: AuctionStatus.COMPLETED,
          },
        );
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
}
