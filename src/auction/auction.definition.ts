import { GraphQLISODateTime, Int, registerEnumType } from '@nestjs/graphql';
import {
  BelongsTo,
  Definition,
  Filterable,
  GraphQLObjectId,
  ObjectId,
  Property,
  Skip,
} from 'dryerjs';
import { BaseModel, BaseStatus } from 'src/base/base.definition';
import { BaseModelHasOwner, Product } from 'src/product/product.definition';
import { User } from 'src/user/user.definition';
export enum AuctionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  RUNNING = 'RUNNING',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

registerEnumType(AuctionStatus, {
  name: 'AuctionStatus',
});

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
    output: { type: () => GraphQLISODateTime },
    nullable: true,
  })
  cancelAt: Date;

  @Property({
    type: () => Boolean,
    db: { default: false },
    nullable: true,
  })
  startAutomatically: boolean;

  @Filterable(() => AuctionStatus, {
    operators: ['eq', 'in', 'notIn', 'notEq'],
  })
  @Property({
    output: { type: () => AuctionStatus },
    db: {
      default: AuctionStatus.PENDING,
    },
    nullable: true,
  })
  status: AuctionStatus;

  @Property({
    type: () => Int,
    db: {
      default: 0,
    },
    nullable: true,
    create: Skip,
    update: Skip,
  })
  totalParticipants: number;

  @Property({
    type: () => String,
    nullable: true,
    create: Skip,
  })
  cancelReason: string;

  @Property({
    type: () => [GraphQLObjectId],
    db: {
      default: [],
    },
    nullable: true,
    create: Skip,
    update: Skip,
  })
  participantIds: ObjectId[];

  @Property({
    type: () => [GraphQLObjectId],
    db: {
      default: null,
    },
    nullable: true,
    create: Skip,
    update: Skip,
  })
  winnerId: ObjectId;

  @BelongsTo(() => User, { from: 'winnerId', skipExistenceCheck: true })
  winner: User;
  // backup_users: User[]
  deposit: number;
}

@Definition({
  timestamps: true,
})
export class AuctionBiddingHistory extends BaseModelHasOwner() {
  @Filterable(() => GraphQLObjectId, {
    operators: ['eq', 'in', 'notIn', 'notEq'],
  })
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
