import { Injectable } from '@nestjs/common';
import { BaseService, InjectBaseService } from 'dryerjs';
import { Notification, NotificationTypeEnum } from './notification.definition';
import { Context } from 'src/auth/ctx';
import { OnEvent } from '@nestjs/event-emitter';
import { EventGateway } from 'src/gateway/event.gateway';

@Injectable()
export class NotificationService {
  constructor(
    @InjectBaseService(Notification)
    public notificationService: BaseService<Notification, {}>,
    public socketEvent: EventGateway,
  ) {}

  @OnEvent('send-notification')
  async handleSendNotification({ message, notificationType, receiver }: any) {
    try {
      const createdNotification = await this.notificationService.create(null, {
        message,
        notificationType,
        receiver,
      });
      console.log({ event: receiver + ':notification' });
      this.socketEvent.emitTo(receiver, receiver + ':notification', {
        ...createdNotification,
      });
      console.log('sent notification', { message, notificationType, receiver });
    } catch (error) {
      console.log('error', error);
      this.socketEvent.emitTo('adminbroadcast', 'admin:notification', {
        message: 'error: ' + JSON.stringify(error?.message || error),
        error: NotificationTypeEnum.ERROR,
      });
    }
  }
}
