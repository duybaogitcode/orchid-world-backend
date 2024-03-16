import { Int, registerEnumType } from '@nestjs/graphql';
import {
  BelongsTo,
  Definition,
  Embedded,
  Filterable,
  GraphQLObjectId,
  ObjectId,
  Property,
  Sortable,
} from 'dryerjs';
import { BaseModel, SimpleStatus } from 'src/base/base.definition';
import { BaseModelHasOwner } from 'src/product/product.definition';
import { User } from 'src/user/user.definition';
import { v4 as uuidv4 } from 'uuid';

export enum SubscriptionPeriodUnit {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
  LIFETIME = 'LIFETIME',
}

registerEnumType(SubscriptionPeriodUnit, {
  name: 'SubscriptionPeriodUnit',
});

@Definition()
export class SubscriptionAttribute {
  @Property({
    type: () => String,
  })
  name: string;

  @Property({
    type: () => String,
    nullable: true,
  })
  description: string;
}

@Definition({
  enableTextSearch: true,
  timestamps: true,
})
export class AuctionSubscription extends BaseModel() {
  @Filterable(() => SimpleStatus, {
    operators: ['contains'],
  })
  @Property({
    type: () => String,
  })
  name: string;

  @Property({
    type: () => String,
    nullable: true,
  })
  description: string;

  @Property({
    type: () => String,
    db: {
      default: uuidv4(),
    },
    nullable: true,
  })
  planId: string;

  @Filterable(() => SimpleStatus, {
    operators: ['eq', 'in'],
  })
  @Property({
    type: () => SimpleStatus,
    db: {
      default: SimpleStatus.INACTIVE,
    },
    nullable: true,
  })
  status: SimpleStatus;

  @Filterable(() => Int, {
    operators: ['gt', 'lte', 'gte', 'in'],
  })
  @Property({ type: () => Int, nullable: true })
  registrationPeriod: number;

  @Property({ type: () => SubscriptionPeriodUnit })
  registrationPeriodUnit: SubscriptionPeriodUnit;

  @Sortable()
  @Property({ type: () => Number })
  price: number;

  @Sortable()
  @Property({ type: () => Int })
  auctionTime: number;

  @Embedded(() => SubscriptionAttribute)
  attributes: SubscriptionAttribute[];
}

@Definition({
  timestamps: true,
})
export class UserSubscription extends BaseModel() {
  @Filterable(() => String, {
    operators: ['eq'],
  })
  @Property({ type: () => GraphQLObjectId })
  subscriptionId: ObjectId;

  @BelongsTo(() => AuctionSubscription, { from: 'subscriptionId' })
  subscription: AuctionSubscription;

  @Property({ type: () => Int })
  auctionTime: number;

  @Property({ type: () => Date })
  startAt: Date;

  @Property({ type: () => Date })
  expireAt: Date;

  @Property({
    type: () => GraphQLObjectId,
    db: {
      unique: true,
    },
  })
  userId: ObjectId;

  @BelongsTo(() => User, { from: 'userId' })
  user: User;
}
