import { registerEnumType } from '@nestjs/graphql';
import { Definition, Embedded, GraphQLObjectId, Property } from 'dryerjs';
import { BaseModel } from 'src/base/base.definition';

export enum NotificationTypeEnum {
  SYSTEM = 'SYSTEM',
  USER = 'USER',
  TRANSACTION = 'TRANSACTION',
  ORDER = 'ORDER',
  AUCTION = 'AUCTION',
  SHOP = 'SHOP',
  PRODUCT = 'PRODUCT',
  OTHER = 'OTHER',
  ERROR = 'ERROR',
}

registerEnumType(NotificationTypeEnum, {
  name: 'NotificationTypeEnum',
});

@Definition({
  timestamps: true,
})
export class Notification extends BaseModel() {
  @Property({
    type: () => String,
  })
  message: string;

  @Property({
    type: () => GraphQLObjectId,
    nullable: true,
  })
  receiver: string;

  @Property({
    type: () => NotificationTypeEnum,
    defaultValue: NotificationTypeEnum.SYSTEM,
  })
  notificationType: NotificationTypeEnum;

  @Property({
    type: () => Boolean,
    db: {
      default: false,
    },
  })
  isRead: boolean;
}
