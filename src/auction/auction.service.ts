import { Injectable } from '@nestjs/common';
import { BaseService, InjectBaseService, ObjectId } from 'dryerjs';
import { Auction, AuctionStatus } from './auction.definition';
import { Product, ProductStatus } from 'src/product/product.definition';
import { User } from 'src/user/user.definition';
import * as moment from 'moment';
export class AuctionService {
  private static instance: AuctionService | null = null;
  constructor(
    @InjectBaseService(Auction)
    private readonly auctionService: BaseService<Auction, {}>,
    @InjectBaseService(Product)
    private readonly productService: BaseService<Product, {}>,
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
    const utc = moment().utc().toDate();
    const utcFormatted = moment(utc).format('YYYY-MM-DD HH:mm:ss');
    const current = moment().format('YYYY-MM-DD HH:mm:ss');
    const dateNow = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
    console.log('🚀 ~ AuctionService ~ startAuction ~ startAt:', {
      utc,
      utcFormatted,
      current,
      dateNow,
    });
    // const started = await this.auctionService.model.findOneAndUpdate(
    //   {},
    //   {
    //     id: auctionId,
    //     status: AuctionStatus.RUNNING,
    //     $currentDate: {
    //       startedAt: true,
    //     },

    //   },
    // );

    // started.duration
  }
}
