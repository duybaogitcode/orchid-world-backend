import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import * as dayjs from 'dayjs';
import { BaseService, InjectBaseService, ObjectId } from 'dryerjs';
import * as moment from 'moment';
import { NotificationTypeEnum } from 'src/notification/notification.definition';
import { NotificationEvent } from 'src/notification/notification.service';
import { ServiceProvider } from 'src/payment/payment.definition';
import { SystemWalletEventEnum } from 'src/wallet/event/system.wallet.event';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from 'src/wallet/transaction.definition';
import { Wallet } from 'src/wallet/wallet.definition';
import { doesWalletAffordable } from 'src/wallet/wallet.service';
import { SubscribeToSubscriptionDTO } from './dto/subscribe.dto';
import {
  AuctionSubscription,
  SubscriptionPeriodUnit,
  UserSubscription,
} from './subscription.definition';

export enum SubscriptionEvents {
  SUBSCRIBE = 'SUBSCRIBE',
  UNSUBSCRIBE = 'UNSUBSCRIBE',
  MINUS_ONE = 'MINUS_ONE',
}

export const SubscriptionPayload = {
  getMinusOnePayload: (userId: ObjectId) => {
    return {
      payload: {
        userId,
      },
    };
  },
};

@Injectable()
export class SubscriptionService {
  constructor(
    @InjectBaseService(AuctionSubscription)
    private readonly auctionSubscriptionService: BaseService<
      AuctionSubscription,
      {}
    >,
    @InjectBaseService(UserSubscription)
    private readonly userSubscription: BaseService<UserSubscription, {}>,
    @InjectBaseService(Wallet)
    private readonly walletService: BaseService<Wallet, {}>,
    @InjectBaseService(Transaction)
    private readonly transactionService: BaseService<Transaction, {}>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  getDateFormatter() {
    return dayjs;
  }

  doesSubscriptionExpired(expireAt: Date) {
    return dayjs().isAfter(dayjs(expireAt));
  }
  async subscribe(userId: ObjectId, input: SubscribeToSubscriptionDTO) {
    const session = await this.auctionSubscriptionService.model.startSession();
    session.startTransaction();

    try {
      const subscription = await this.auctionSubscriptionService.model.findOne({
        planId: input.planId,
      });

      const wallet = await this.walletService.model.findOne({
        authorId: new ObjectId(userId),
      });

      if (!wallet) {
        throw new UnauthorizedException('Wallet not found');
      }

      const isAffordable = doesWalletAffordable(wallet, subscription.price);

      if (!isAffordable) {
        throw new UnauthorizedException('Not enough balance');
      }

      wallet.balance -= subscription.price;
      await wallet.save({ session });

      const userSubscriptions = await this.userSubscription.model.find({
        userId: new ObjectId(userId),
      });

      const activeSubscription = userSubscriptions.find(
        (subscription) => !this.doesSubscriptionExpired(subscription.expireAt),
      );

      if (activeSubscription) {
        throw new UnauthorizedException('There is an active subscription');
      }

      const transaction = new this.transactionService.model({
        amount: subscription.price,
        description: 'Subscribe to ' + subscription.name,
        status: TransactionStatus.SUCCESS,
        type: TransactionType.DECREASE,
        walletId: wallet.id,
      });

      await transaction.save({ session });

      const dateFormatter = this.getDateFormatter();

      const startAtDayjs = dateFormatter().locale('vi');
      const expireAt = this.getEndDate(
        startAtDayjs,
        subscription.registrationPeriod,
        subscription.registrationPeriodUnit,
      );

      console.log(expireAt);

      let userSubscriptionExist = userSubscriptions.find(
        (subscription) =>
          subscription.subscriptionId.toString() === subscription.id.toString(),
      );

      if (userSubscriptionExist) {
        userSubscriptionExist.startAt = startAtDayjs.toDate();
        userSubscriptionExist.expireAt = expireAt;
        userSubscriptionExist.auctionTime =
          userSubscriptionExist.auctionTime + subscription.auctionTime;
      } else {
        userSubscriptionExist = new this.userSubscription.model({
          subscriptionId: subscription.id,
          startAt: startAtDayjs.toDate(),
          expireAt: expireAt,
          userId: userId,
          auctionTime: subscription.auctionTime,
        });
      }

      await userSubscriptionExist.save({ session });

      this.eventEmitter.emit(NotificationEvent.SEND, {
        href: '/shop/subscription/' + userSubscriptionExist.id,
        message: 'Đăng ký gói đấu giá thành công',
        notificationType: NotificationTypeEnum.SYSTEM,
        receiver: userId,
      });

      setTimeout(() => {
        this.eventEmitter.emit(SystemWalletEventEnum.CREATED, {
          input: {
            amount: subscription.price,
            type: TransactionType.INCREASE,
            walletId: wallet._id,
            logs: '',
            serviceProvider: ServiceProvider.paypal,
            isTopUpOrWithdraw: false,
          },
        });
      }, 3000);
      await session.commitTransaction();
      session.endSession();
      return userSubscriptionExist;
    } catch (error) {
      console.log('🚀  ~ error:', error);
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  getEndDate(
    startAt: dayjs.Dayjs,
    period: number,
    periodUnit: SubscriptionPeriodUnit,
  ): Date {
    const startAtDayjs = startAt;
    let endDate: dayjs.Dayjs;
    switch (periodUnit) {
      case SubscriptionPeriodUnit.DAY:
        endDate = startAtDayjs.add(period, 'day');
        break;
      case SubscriptionPeriodUnit.WEEK:
        endDate = startAtDayjs.add(period, 'week');
        break;
      case SubscriptionPeriodUnit.MONTH:
        endDate = startAtDayjs.add(period, 'month');
        break;
      case SubscriptionPeriodUnit.YEAR:
        endDate = startAtDayjs.add(period, 'year');
        break;
      case SubscriptionPeriodUnit.LIFETIME:
        endDate = startAtDayjs.add(100, 'year');
        break;
      default:
        throw new Error('Invalid subscription period unit');
    }
    return endDate.toDate();
  }

  async unsubscribe(userId: ObjectId) {
    const session = await this.userSubscription.model.startSession();
    session.startTransaction();
    try {
      const userSubscription = await this.userSubscription.model.findOne({
        userId: new ObjectId(userId),
      });
      if (!userSubscription) {
        throw new UnauthorizedException('Subscription not found');
      }

      await userSubscription.deleteOne({ session });

      this.eventEmitter.emit('refund', {
        payload: {
          userId,
        },
      });

      // Notify user
      this.eventEmitter.emit(NotificationEvent.SEND, {
        href: '/shop/auctions/pricing',
        message: 'Hủy gói đấu giá thành công',
        notificationType: NotificationTypeEnum.SYSTEM,
        receiver: userId,
      });

      await session.commitTransaction();
      session.endSession();
      return userSubscription;
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  @OnEvent('refund')
  async handleRefund({ payload }: { payload: { userId: ObjectId } }) {
    const session = await this.userSubscription.model.startSession();
    session.startTransaction();
    try {
      const userSubscriptionAggregation =
        await this.userSubscription.model.aggregate([
          {
            $match: {
              userId: new ObjectId(payload.userId),
            },
          },
          {
            $lookup: {
              from: 'auctionsubscriptions',
              localField: 'subscriptionId',
              foreignField: '_id',
              as: 'subscription',
            },
          },
          {
            $unwind: '$subscription',
          },
        ]);
      const userSubscription = userSubscriptionAggregation[0];
      if (userSubscription) {
        const wallet = await this.walletService.model.findOne({
          authorId: new ObjectId(payload.userId),
        });
        const refund = this.getRefundBaseOnExpireTime(userSubscription);
        if (refund > 0) {
          wallet.balance += refund;
          await wallet.save();
          const transaction = new this.transactionService.model({
            amount: refund,
            description: 'Hoàn tiền ' + userSubscription.subscription.name,
            status: TransactionStatus.SUCCESS,
            type: TransactionType.INCREASE,
            walletId: wallet.id,
          });
          await transaction.save();
        }
      }

      await session.commitTransaction();
      session.endSession();
    } catch (error) {
      await session.abortTransaction();
      session.endSession();
      throw error;
    }
  }

  // Calculate the refund base on expire time. This will be the rest money that will be returned to the wallet when the user unsubscribe before the expire time
  getRefundBaseOnExpireTime(userSubscription: UserSubscription) {
    const expireAt = moment(userSubscription.expireAt).utcOffset(7);
    const startAt = moment(userSubscription.startAt).utcOffset(7);
    const now = moment().utcOffset(7);
    console.log({ isAfter: now.isAfter(expireAt), expireAt, startAt, now });
    if (now.isAfter(expireAt)) {
      return 0;
    }

    const diff = startAt.diff(now, 'days');
    console.log({ diff });
    // if the diff is lower than 4 days, we will return a half
    if (diff <= 4) {
      const refund = userSubscription.subscription.price / 2;
      console.log(
        '🚀 ~ SubscriptionService ~ getRefundBaseOnExpireTime ~ < 4 refund:',
        refund,
      );
      return Math.ceil(refund);
    }

    const price = userSubscription.subscription.price;
    const refund = price - price * (diff / 30);
    console.log(
      '🚀 ~ SubscriptionService ~ getRefundBaseOnExpireTime ~ refund:',
      refund,
    );
    return Math.ceil(refund);
  }

  async findUserSubscriptions(userId: ObjectId) {
    const response = await this.userSubscription.model.findOne({ userId });
    return response;
  }

  @OnEvent(SubscriptionEvents.MINUS_ONE)
  async handleMinusOne({
    payload,
  }: {
    payload: {
      userId: ObjectId;
    };
  }) {
    const userSubscription = await this.userSubscription.model.findOne({
      userId: new ObjectId(payload.userId),
    });
    if (userSubscription) {
      userSubscription.auctionTime = userSubscription.auctionTime - 1;
      console.log(
        '🚀 ~ file: subscription.service.ts ~ line 198 ~ SubscriptionService ~ handleMinusOne ~ userSubscription.auctionTime',
        userSubscription.auctionTime,
      );
      await userSubscription.save();
    }
  }
}
