import { GraphQLISODateTime, Int, registerEnumType } from '@nestjs/graphql';
import {
  BelongsTo,
  Definition,
  Filterable,
  GraphQLObjectId,
  HasOne,
  ObjectId,
  Property,
} from 'dryerjs';
import { BaseModel, BaseStatus } from 'src/base/base.definition';
import { BaseModelHasOwner, Product } from 'src/product/product.definition';

enum AuctionDurationUnit {
  MINUTE = 'minute',
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
}

registerEnumType(AuctionDurationUnit, {
  name: 'AuctionDurationUnit',
});

@Definition({
  timestamps: true,
})
export class Auction extends BaseModelHasOwner() {
  @Property({
    type: () => GraphQLObjectId,
  })
  productId: ObjectId;

  @BelongsTo(() => Product, { from: 'productId' })
  product: Product;

  @Filterable(() => String, {
    operators: ['eq', 'contains'],
  })
  @Property({
    type: () => String,
    db: { index: true },
  })
  auctionName: string;

  @Property({
    type: () => String,
    nullable: true,
  })
  auctionDescription: string;

  @Property({
    type: () => Int,
  })
  initialPrice: number;

  @Property({
    type: () => Int,
  })
  stepPrice: number;

  @Property({
    type: () => Int,
    db: {
      default: 0,
    },
    nullable: true,
  })
  currentPrice: number;

  @Property({
    type: () => Int,
  })
  duration: number;

  @Property({
    type: () => AuctionDurationUnit,
  })
  durationUnit: AuctionDurationUnit;

  @Property({
    output: { type: () => GraphQLISODateTime },
    nullable: true,
  })
  expireAt: Date;

  @Property({
    output: { type: () => GraphQLISODateTime },
    nullable: true,
  })
  startAt: Date;

  @Property({
    type: () => Boolean,
    db: { default: false },
    nullable: true,
  })
  startAutomatically: boolean;

  @Filterable(() => BaseStatus, {
    operators: ['eq', 'in', 'notIn', 'notEq'],
  })
  @Property({
    output: { type: () => BaseStatus },
    db: {
      default: BaseStatus.PENDING,
    },
    nullable: true,
  })
  status: BaseStatus;

  totalParticipants: number;
  //   winner: User
  // backup_users: User[]
  deposit: number;
}

@Definition({
  timestamps: true,
})
export class AuctionBiddingHistory extends BaseModel() {
  @Property({
    type: () => GraphQLObjectId,
  })
  auctionId: ObjectId;
  @BelongsTo(() => Auction, { from: 'auctionId' })
  auction: Auction;
  //   author: User
  @Property({
    db: { min: 1 },
  })
  bidPrice: number;
}
