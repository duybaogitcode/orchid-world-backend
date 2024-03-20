import { InputType, OmitType, registerEnumType } from '@nestjs/graphql';
import { create } from 'domain';
import {
  BelongsTo,
  CreateInputType,
  Definition,
  Embedded,
  Filterable,
  GraphQLObjectId,
  HasMany,
  ObjectId,
  Property,
  Skip,
  allOperators,
} from 'dryerjs';
import { BaseModel, BaseStatus } from 'src/base/base.definition';
import { BaseModelHasOwner, Product } from 'src/product/product.definition';
import { User } from 'src/user/user.definition';
// import { OrderTransaction } from './orderTransaction.definition';
import { forwardRef } from '@nestjs/common';
import { OrderTransaction } from './orderTransaction.definition';
import { OrderEvidence } from './orderEvidence.definition';
import { OrderIssues } from './orderIssues.definition';
import { FileUpload, GraphQLUpload } from 'graphql-upload-ts';

export enum OrderStatus {
  PENDING = 'PENDING',
  SHIPPING = 'SHIPPING',
  WAITING = 'WAITING',
  CANCELED = 'CANCELED',
  DELIVERED = 'DELIVERED',
  CONFIRMED_RECEIPT = 'CONFIRMED_RECEIPT',
  RETURNING = 'RETURNING',
  RETURNED = 'RETURNED',
  PAYING = 'WAITING_FOR_PAYMENT',
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
  @Filterable(() => String, { operators: ['contains'] })
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

Definition();
class CartShopItemInput {
  @Property({ type: () => GraphQLObjectId, db: Skip, output: Skip })
  cartShopItemId: ObjectId;

  @Property({ type: () => [GraphQLObjectId], db: Skip, output: Skip })
  cartItemId: [ObjectId];
}

const CartShopItemInputType = CreateInputType(CartShopItemInput);

@Definition()
export class Shop {
  @Filterable(() => String, { operators: ['contains'] })
  @Property({ type: () => String })
  shopName: string;

  @Property({ type: () => String })
  shopPhone: string;

  @Embedded(() => ProductInOrder)
  productInOrder: ProductInOrder[];
}

@Definition({
  timestamps: true,
  enableTextSearch: true,
  schemaOptions: { selectPopulatedPaths: true },
})
export class Order extends BaseModelHasOwner() {
  @Property({ type: () => String, nullable: true })
  note: string;

  @Filterable(() => String, { operators: ['contains'] })
  @Property({ type: () => String, db: { unique: true, sparse: true } })
  code: string;

  @Embedded(() => Shop)
  shop: Shop;

  @Property({ type: () => CartShopItemInputType, db: Skip, output: Skip })
  cartShopItemInput: CartShopItemInput;

  @Property({ type: () => GraphQLObjectId })
  shopId: ObjectId;

  @BelongsTo(() => User, { from: 'shopId', noPopulation: true })
  refToShop: User;

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
  })
  orderTransaction: OrderTransaction;

  @Embedded(() => DeliveredUnit)
  deliveredUnit: DeliveredUnit;

  @HasMany(() => OrderEvidence, {
    to: 'orderId',
    allowCreateWithin: true,
    allowFindAll: true,
  })
  orderEvidence: OrderEvidence[];

  @Property({
    type: () => GraphQLUpload,
    db: Skip,
    output: Skip,
    nullable: true,
  })
  file: Promise<FileUpload>;

  @Property({ type: () => String, db: Skip, output: Skip })
  description: string;

  @Property({ type: () => String, db: Skip, output: Skip })
  issue: string;
}

@Definition({ timestamps: true })
export class OrderNotId {
  @Property({ type: () => String, nullable: true })
  note: string;

  @Property({ type: () => String })
  code: string;

  @Embedded(() => Shop)
  shop: Shop;

  @Property({ type: () => CartShopItemInputType, db: Skip, output: Skip })
  cartShopItemInput: CartShopItemInput;

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
