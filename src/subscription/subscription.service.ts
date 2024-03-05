import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as dayjs from 'dayjs';
import { BaseService, InjectBaseService, ObjectId } from 'dryerjs';
import { NotificationTypeEnum } from 'src/notification/notification.definition';
import { NotificationEvent } from 'src/notification/notification.service';
import { SubscribeToSubscriptionDTO } from './subscribe.dto';
import {
  AuctionSubscription,
  SubscriptionPeriodUnit,
  UserSubscription,
} from './subscription.definition';
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
    private readonly eventEmitter: EventEmitter2,
  ) {}

  getDateFormatter() {
    return dayjs;
  }
  async subscribe(userId: ObjectId, input: SubscribeToSubscriptionDTO) {
    if (!userId) throw new UnauthorizedException();
    const subscription = await this.auctionSubscriptionService.findOne(
      {},
      {
        planId: input.planId,
      },
    );
    const dateFormatter = this.getDateFormatter();
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
