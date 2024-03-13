import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as dayjs from 'dayjs';
import { BaseService, InjectBaseService, ObjectId } from 'dryerjs';
import { NotificationTypeEnum } from 'src/notification/notification.definition';
import { NotificationEvent } from 'src/notification/notification.service';
import { SubscribeToSubscriptionDTO } from './dto/subscribe.dto';
import {
  AuctionSubscription,
  SubscriptionPeriodUnit,
  UserSubscription,
} from './subscription.definition';
import { PaypalService } from 'src/payment/paypal.service';
import {
  Transaction,
  TransactionStatus,
  TransactionType,
} from 'src/wallet/transaction.definition';
import { Wallet } from 'src/wallet/wallet.definition';
import { SystemWalletEventEnum } from 'src/wallet/event/system.wallet.event';
import { ServiceProvider } from 'src/payment/payment.definition';
import { doesWalletAffordable } from 'src/wallet/wallet.service';
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

      let userSubscriptionExist = userSubscriptions.find(
        (subscription) =>
          subscription.subscriptionId.toString() === subscription.id.toString(),
      );

      if (userSubscriptionExist) {
        userSubscriptionExist.startAt = startAtDayjs.toDate();
        userSubscriptionExist.expireAt = expireAt;
      } else {
        userSubscriptionExist = new this.userSubscription.model({
          subscriptionId: subscription.id,
          startAt: startAtDayjs.toDate(),
          expireAt: expireAt,
          userId: userId,
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
}
