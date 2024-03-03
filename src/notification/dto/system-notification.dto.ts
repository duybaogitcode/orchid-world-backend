import { CreateInputType } from 'dryerjs';
import { Notification } from '../notification.definition';
import { InputType, OmitType } from '@nestjs/graphql';

const NotificationInput = CreateInputType(Notification);

@InputType()
export class SystemNotificationDto extends OmitType(NotificationInput, [
  'id',
  'createdAt',
  'updatedAt',
  'isRead',
]) {}
