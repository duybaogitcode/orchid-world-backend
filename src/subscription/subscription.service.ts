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
} from 'src/wallet/transaction.definition';
@Injectable()
export class SubscriptionService {
  constructor(
    @InjectBaseService(AuctionSubscription)
    private readonly auctionSubscriptionService: BaseService<
      AuctionSubscription,
      {}
    >,
    @InjectBaseService(Transaction)
    private readonly transactionService: BaseService<Transaction, {}>,
    @InjectBaseService(UserSubscription)
    private readonly userSubscription: BaseService<UserSubscription, {}>,
    private readonly eventEmitter: EventEmitter2,
    private readonly paypalService: PaypalService,
  ) {}

  getDateFormatter() {
    return dayjs;
  }
  async subscribe(userId: ObjectId, input: SubscribeToSubscriptionDTO) {
    if (!userId) throw new UnauthorizedException();
    if (!input.transactionId) throw new Error('Payment is required');

    const transaction = await this.transactionService.findOne(
      {},
      {
        id: input.transactionId,
      },
    );

    const subscription = await this.auctionSubscriptionService.findOne(
      {},
      {
        planId: input.planId,
      },
    );

    if (transaction.status !== TransactionStatus.SUCCESS) {
      throw new Error('Invalid transaction status');
    }

    if (transaction.amount !== subscription.price) {
      throw new Error('Invalid transaction amount');
    }

    // TODO: Does user have subscription before?
    const userSubscription = await this.userSubscription.findOne(
      {},
      {
        userId: userId,
      },
    );

    const dateFormatter = this.getDateFormatter();

    if (userSubscription) {
      // if (!this.doesSubscriptionExpired(userSubscription.expireAt)) {

      // }
      // TODO: Handle upgrade or downgrade subscription
      throw new Error('User already have subscription');
    }

    const startAtDayjs = dateFormatter().locale('vi');
    const expireAt = this.getEndDate(
      startAtDayjs,
      subscription.registrationPeriod,
      subscription.registrationPeriodUnit,
    );

    const createdUserSubscription = await this.userSubscription.create(
      {},
      {
        subscriptionId: subscription.id,
        startAt: startAtDayjs.toDate(),
        expireAt: expireAt,
        userId: userId,
      },
    );

    this.eventEmitter.emit(NotificationEvent.SEND, {
      href: '/shop/subscription/' + createdUserSubscription.id,
      message: 'Đăng ký gói đấu giá thành công',
      notificationType: NotificationTypeEnum.SYSTEM,
      receiver: userId,
    });

    return createdUserSubscription;
  }

  doesSubscriptionExpired(expireAt: Date) {
    return dayjs().isAfter(dayjs(expireAt));
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
