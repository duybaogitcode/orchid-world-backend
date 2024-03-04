import { Injectable } from '@nestjs/common';
import { BaseService, InjectBaseService, ObjectId } from 'dryerjs';
import { Notification, NotificationTypeEnum } from './notification.definition';
import { Context } from 'src/auth/ctx';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { EventGateway } from 'src/gateway/event.gateway';
import { SystemNotificationDto } from './dto/system-notification.dto';
import { registerEnumType } from '@nestjs/graphql';

export enum NotificationEvent {
  READ = 'notification:read',
  SEND = 'notification:send',
}

registerEnumType(NotificationEvent, {
  name: 'NotificationEvent',
});

// export const NotificationFactory = {
//   input:
// }

@Injectable()
export class NotificationService {
  constructor(
    @InjectBaseService(Notification)
    public notificationService: BaseService<Notification, {}>,
    public socketEvent: EventGateway,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async systemNotification(input: SystemNotificationDto) {
    const createdNotification = await this.notificationService.create(null, {
      message: input.message,
      notificationType: input.notificationType,
      receiver: input.receiver,
    });
    console.log('Emit system notification');
    this.socketEvent.server.emit('notification', {
      ...createdNotification,
    });
  }

  async readNotification(id: ObjectId) {
    this.eventEmitter.emit(NotificationEvent.READ, id);
    return true;
  }

  @OnEvent(NotificationEvent.READ)
  async handleReadNotification(id: ObjectId) {
    try {
      if (!id) throw new Error('id is required');
      await this.notificationService.update(
        {},
        {
          id: id,
          isRead: true,
        },
      );
    } catch (error) {
      console.error('Failed read notification:', error);
      throw error;
    }
  }

  @OnEvent(NotificationEvent.SEND)
  async handleSendNotification({
    message,
    notificationType,
    receiver,
  }: {
    message: string;
    notificationType: NotificationTypeEnum;
    receiver: ObjectId;
  }) {
    try {
      const createdNotification = await this.notificationService.create(null, {
        message,
        notificationType,
        receiver: receiver.toString(),
      });
      this.socketEvent.emitTo(receiver.toString(), 'notification', {
        ...createdNotification,
      });
    } catch (error) {
      console.log('error', error);
      this.socketEvent.emitTo('adminbroadcast', 'notification', {
        message: 'error: ' + JSON.stringify(error?.message || error),
        error: NotificationTypeEnum.ERROR,
      });
    }
  }
}
