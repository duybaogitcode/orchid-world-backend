import { Injectable } from '@nestjs/common';
import { BiddingDTO } from './dto/bidding.dto';
import { BaseService, InjectBaseService, ObjectId } from 'dryerjs';
import { Auction, AuctionBiddingHistory } from './auction.definition';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { NotificationEvent } from 'src/notification/notification.service';
import { createNotification } from 'src/notification/notification.resolver';
import { Product } from 'src/product/product.definition';
import { NotificationTypeEnum } from 'src/notification/notification.definition';
import { EventGateway } from 'src/gateway/event.gateway';

@Injectable()
export class BiddingService {
  constructor(
    @InjectBaseService(AuctionBiddingHistory)
    private readonly auctionBiddingHistoryService: BaseService<
      AuctionBiddingHistory,
      {}
    >,
    @InjectBaseService(Auction)
    private readonly auctionService: BaseService<Auction, {}>,
    @InjectBaseService(Product)
    private readonly productService: BaseService<Product, {}>,
    private readonly eventEmitter: EventEmitter2,
    private readonly eventGateway: EventGateway,
  ) {}

  async bid(input: BiddingDTO, userId: ObjectId) {
    const auction = await this.validateAndFindOne(input, userId);
    const product = await this.productService.findById(
      {},
      { _id: auction.productId },
    );
    const bid = await this.auctionBiddingHistoryService.create(
      {},
      {
        ...input,
        auctionId: input.auctionId,
        authorId: new ObjectId(userId),
        //   userId,
      },
    );

    const biddingCount =
      (await this.auctionBiddingHistoryService.model.countDocuments(
        {
          auctionId: input.auctionId,
        },
        { ignoreUndefined: true },
      )) || 0;

    this.emitUpdateForClient(auction, bid);
    this.eventEmitter.emit('auction:update-current-price', {
      auction,
      currentPrice: bid.bidPrice,
    });
    // Notify for auction owner if bidding count is 10, 20, 30, 40, ...
    if (biddingCount % 10 === 0) {
      this.eventEmitter.emit(
        NotificationEvent.SEND,
        createNotification({
          href: `/auctions/${product.slug}`,
          message: `Buổi đấu giá ${product.name} đã có ${biddingCount} lượt đấu giá`,
          notificationType: NotificationTypeEnum.AUCTION,
          receiver: auction.authorId,
        }),
      );
    }

    return bid;
  }

  @OnEvent('auction:update-current-price')
  async handleAuctionUpdateCurrentPrice(payload: {
    auction: Auction;
    currentPrice: number;
  }) {
    try {
      const { auction, currentPrice } = payload;
      await this.auctionService.update(
        {},
        {
          id: auction.id,
          currentPrice,
        },
      );
    } catch (error) {
      console.log('Error when update current price', error);
    }
  }

  emitUpdateForClient(auction: Auction, createdBid: AuctionBiddingHistory) {
    this.eventGateway.emitTo(auction?.id?.toString(), 'auction:new-bid', {
      auction,
      bid: createdBid,
    });
  }

  async validateAndFindOne(input: BiddingDTO, userId?: ObjectId) {
    const auction = await this.auctionService.findById(
      {},
      { _id: input.auctionId },
    );
    if (!auction.participantIds.includes(userId)) {
      throw new Error('User is not participant');
    }
    if (auction.status !== 'RUNNING') {
      throw new Error('Auction is not running');
    }
    const lastBid = await this.auctionBiddingHistoryService.model.findOne(
      { auctionId: input.auctionId },
      { bidPrice: 1, userId: 1 },
      {
        sort: {
          createdAt: -1,
        },
      },
    );

    console.log({ lastBid });

    if (userId && lastBid && lastBid.authorId === userId) {
      throw new Error('Cannot bid. You are the last bidder');
    }

    if (userId === auction.authorId) {
      throw new Error('Cannot bid. You are the owner of the auction');
    }
    if (input.bidPrice < auction.initialPrice) {
      throw new Error('Price is lower than starting price');
    }

    if (lastBid && lastBid.bidPrice >= input.bidPrice) {
      throw new Error('Price is lower than last bid');
    }

    if ((input.bidPrice - auction.initialPrice) % auction.stepPrice !== 0) {
      throw new Error('Price is not a valid bidding price');
    }

    return auction;
  }
}
