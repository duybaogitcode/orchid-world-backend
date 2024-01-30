import { GraphQLISODateTime } from '@nestjs/graphql';
import {
  BelongsTo,
  Definition,
  GraphQLObjectId,
  HasOne,
  ObjectId,
  Property,
} from 'dryerjs';
import { BaseModel, BaseStatus } from 'src/base/base.definition';
import { Product } from 'src/product/product.definition';

@Definition()
export class Auction extends BaseModel() {
  @Property({
    type: () => GraphQLObjectId,
  })
  productId: ObjectId;

  @BelongsTo(() => Product, { from: 'productId' })
  product: Product;

  name: string;

  initialPrice: number;
  stepPrice: number;
  currentPrice: number;

  @Property({
    output: { type: () => GraphQLISODateTime },
  })
  expireAt: Date;

  @Property({
    output: { type: () => GraphQLISODateTime },
  })
  startAt: Date;

  startAutomatically: boolean;
  @Property({
    output: { type: () => BaseStatus },
  })
  status: BaseStatus;

  //   staff: User
  duration: number;
  totalParticipants: number;
  //   winner: User
  // backup_users: User[]
  deposit: number;
}

@Definition()
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
