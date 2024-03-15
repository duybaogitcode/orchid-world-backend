import { registerEnumType } from '@nestjs/graphql';
import {
  Definition,
  Embedded,
  Filterable,
  GraphQLObjectId,
  ObjectId,
  Property,
} from 'dryerjs';
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
  FEEDBACK = 'FEEDBACK',
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
    nullable: true,
    db: {
      default: '/',
    },
  })
  href: string;

  @Property({
    type: () => String,
  })
  message: string;

  @Filterable(() => GraphQLObjectId, {
    operators: ['eq'],
  })
  @Property({
    type: () => GraphQLObjectId,
    nullable: true,
  })
  receiver: ObjectId;

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
