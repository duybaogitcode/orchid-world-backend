import { OmitType, registerEnumType } from '@nestjs/graphql';
import { create } from 'domain';
import {
  BelongsTo,
  Definition,
  Embedded,
  GraphQLObjectId,
  HasMany,
  ObjectId,
  Property,
  Skip,
} from 'dryerjs';
import { BaseModel, BaseStatus } from 'src/base/base.definition';
import { CartShopItem } from 'src/cart/definition/cartShopItem.definition';
import { BaseModelHasOwner, Product } from 'src/product/product.definition';
import { User } from 'src/user/user.definition';
// import { OrderTransaction } from './orderTransaction.definition';
import { forwardRef } from '@nestjs/common';
import { OrderTransaction } from './orderTransaction.definition';

export enum OrderStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  WAITING = 'WAITING',
  CANCELED = 'CANCELED',
  DELIVERED = 'DELIVERED',
}

registerEnumType(OrderStatus, {
  name: 'OrderStatus',
});

@Definition()
class DeliveredUnit {
  @Property({ type: () => String })
  carrier_name: string;

  @Property({ type: () => String })
  carrier_logo: string;

  @Property({ type: () => String })
  carrier_short_name: string;

  @Property({ type: () => String })
  service: string;

  @Property({ type: () => String })
  expected: string;
}

@Definition()
export class ProductInOrder {
  @Property({ type: () => String })
  name: string;

  @Property({ type: () => String })
  slug: string;

  @Property({ type: () => [String] })
  media: string[];

  @Property({ type: () => Number })
  price: number;

  @Property({ type: () => Number })
  quantity: number;
}

@Definition()
export class Shop {
  @Property({ type: () => String })
  shopName: string;

  @Property({ type: () => String })
  shopPhone: string;

  @Embedded(() => ProductInOrder)
  productInOrder: ProductInOrder[];
}

@Definition({ timestamps: true })
export class Order extends BaseModel() {
  @Property({ type: () => String, nullable: true })
  note: string;

  @Property({ type: () => String, db: { unique: true, sparse: true } })
  code: string;

  @Embedded(() => Shop)
  shop: Shop;

  @Property({ type: () => GraphQLObjectId })
  shopId: ObjectId;

  @BelongsTo(() => User, { from: 'shopId', noPopulation: true })
  refToShop: User;

  @Property({ type: () => GraphQLObjectId, db: Skip, output: Skip })
  cartShopItemId: ObjectId;

  @Property({ type: () => OrderStatus, defaultValue: OrderStatus.PENDING })
  status: OrderStatus;

  @Property({ type: () => String })
  addressFrom: string;

  @Property({ type: () => String })
  addressTo: string;

  @Property({ type: () => Number })
  shippingFee: number;

  @Property({ type: () => Number })
  amountNotShippingFee: number;

  @Property({ type: () => Number })
  totalAmount: number;

  @Property({
    type: () => GraphQLObjectId,
  })
  orderTransactionId: ObjectId;

  @BelongsTo(() => OrderTransaction, {
    from: 'orderTransactionId',
    noPopulation: true,
  })
  orderTransaction: OrderTransaction;

  @Embedded(() => DeliveredUnit)
  deliveredUnit: DeliveredUnit;
}

@Definition({ timestamps: true })
export class OrderNotId {
  @Property({ type: () => String, nullable: true })
  note: string;

  @Property({ type: () => String })
  code: string;

  @Embedded(() => Shop)
  shop: Shop;

  @Property({ type: () => GraphQLObjectId, db: Skip, output: Skip })
  cartShopItemId: ObjectId;

  @Property({ type: () => String })
  addressFrom: string;

  @Property({ type: () => String })
  addressTo: string;

  @Property({ type: () => Number })
  shippingFee: number;

  @Property({ type: () => Number })
  amountNotShippingFee: number;

  @Property({ type: () => Number })
  totalAmount: number;

  @Embedded(() => DeliveredUnit)
  deliveredUnit: DeliveredUnit;
}
