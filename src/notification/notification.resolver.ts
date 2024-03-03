import {
  Args,
  Field,
  InputType,
  Mutation,
  PickType,
  Resolver,
} from '@nestjs/graphql';
import {
  CreateInputType,
  GraphQLObjectId,
  ObjectId,
  OutputType,
  Property,
} from 'dryerjs';
import { SystemNotificationDto } from './dto/system-notification.dto';
import { Notification } from './notification.definition';
import { NotificationService } from './notification.service';
import { GraphQLObjectType } from 'graphql';
import { Types } from 'mongoose';
import { SuccessResponse } from 'dryerjs/dist/types';

@InputType()
export class ReadNotificationDTO {
  @Field(() => GraphQLObjectId)
  id: Types.ObjectId;
}

@Resolver()
export class NotificationResolver {
  constructor(private readonly notificationService: NotificationService) {}
  @Mutation(() => OutputType(Notification), { name: 'systemNotification' })
  async systemNotification(@Args('input') input: SystemNotificationDto) {
    try {
      return this.notificationService.systemNotification(input);
    } catch (error) {
      console.error('Failed find product:', error);
      throw error;
    }
  }

  @Mutation(() => SuccessResponse, { name: 'readNotification' })
  async readNotification(@Args('input') input: ReadNotificationDTO) {
    try {
      await this.notificationService.readNotification(input.id);
      return {
        success: true,
      };
    } catch (error) {
      console.error('Failed find product:', error);
      throw error;
    }
  }
}
