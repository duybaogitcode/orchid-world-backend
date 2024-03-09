import { Injectable } from '@nestjs/common';
import { BaseService, InjectBaseService, ObjectId } from 'dryerjs';
import { Auction, AuctionStatus } from './auction.definition';
import { Product, ProductStatus } from 'src/product/product.definition';
import { User } from 'src/user/user.definition';
import * as moment from 'moment';
import { AgendaQueue, JobPriority } from 'src/queue/agenda.queue';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { NotificationEvent } from 'src/notification/notification.service';
import { createNotification } from 'src/notification/notification.resolver';
import { NotificationTypeEnum } from 'src/notification/notification.definition';

export class AuctionService {
  private static instance: AuctionService | null = null;
  constructor(
    @InjectBaseService(Auction)
    private readonly auctionService: BaseService<Auction, {}>,
    @InjectBaseService(Product)
    private readonly productService: BaseService<Product, {}>,
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
      throw new Error('Auction not found');
    }

    if (await this.isUserParticipatingInAuction(auction, userId)) {
      throw new Error('You are already participating in this auction');
    }

    if (await this.doesUserAreOwnerOfAuction(auction, userId)) {
      throw new Error('You cannot participate in your own auction');
    }

    if (!(await this.isAuctionAvailableForRegister(auction))) {
      throw new Error('Auction is not available for register');
    }
  }

  async checkAuctionValidityBeforeUnregistration(
    auctionId: ObjectId,
    userId: ObjectId,
  ) {
    const auction = await this.auctionService.findOne({}, { id: auctionId });
    if (!auction) {
      throw new Error('Auction not found');
    }

    if (!(await this.isUserParticipatingInAuction(auction, userId))) {
      throw new Error('You are not participating in this auction');
    }

    if (await this.doesUserAreOwnerOfAuction(auction, userId)) {
      throw new Error('You cannot unregister from your own auction');
    }

    if (!(await this.isAuctionAvailableForRegister(auction))) {
      throw new Error('Auction is not available for unregister');
    }
  }

  async registerAuction(auctionId: ObjectId, userId: ObjectId) {
    await this.checkAuctionValidityBeforeRegistration(auctionId, userId);

    return this.auctionService.model.findOneAndUpdate(
      {},
      {
        id: auctionId,
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
      {},
      {
        id: auctionId,
        $pull: {
          participantIds: userId,
        },
        $inc: {
          totalParticipants: -1,
        },
      },
    );
  }

  async startAuction(auctionId: ObjectId) {
    const auction = await this.auctionService.findById({}, { _id: auctionId });
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
      formatedExpireAt,
      formatedStartAt,
      duration,
      durationUnit,
      expireAt,
    });

    // Update auction status to running
    const started = await this.auctionService.model.findOneAndUpdate(
      {},
      {
        id: auctionId,
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
            href: '/auctions/' + auction.product.slug,
            message: `Buổi đấu giá *${auction.product.name}* đã bắt đầu lúc **${formatedStartAt}** và sẽ kết thúc lúc **${formatedExpireAt}**. Hãy chuẩn bị sẵn sàng để tham gia đấu giá nhé.`,
            receiver: participantId,
            notificationType: NotificationTypeEnum.AUCTION,
          }),
        );
      });

    return started;
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
          {},
          {
            id: auctionId,
            status: AuctionStatus.EXPIRED,
          },
        );
      },
    );
    agenda.start();
    agenda.schedule(expireAt, 'auction:expiration', {
      auctionId: auctionId,
    });
  }
}
