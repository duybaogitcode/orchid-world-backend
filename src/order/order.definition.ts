import { registerEnumType } from '@nestjs/graphql';
import {
  BelongsTo,
  Definition,
  GraphQLObjectId,
  HasMany,
  ObjectId,
  Property,
  Skip,
} from 'dryerjs';
import { BaseModel, BaseStatus } from 'src/base/base.definition';
import { BaseModelHasOwner, Product } from 'src/product/product.definition';
import { User } from 'src/user/user.definition';

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
export class OrderItem extends BaseModel() {
  @Property({ type: () => GraphQLObjectId })
  productId: ObjectId;

  @BelongsTo(() => Product, {
    from: 'productId',
  })
  product: Product;

  @Property({ type: () => Number })
  quantity: number;

  @Property({ type: () => Number })
  totalPrice: number;
}

@Definition()
export class Order extends BaseModelHasOwner({
  unique: true,
}) {
  @Property({
    type: () => GraphQLObjectId,
    create: Skip,
    update: Skip,
  })
  userId: ObjectId;

  @BelongsTo(() => User, { from: 'userId' })
  user: User;

  @Property({
    type: () => Number,
    defaultValue: 0,
  })
  totalQuantity: number;

  @Property({
    type: () => Number,
    defaultValue: 0,
  })
  totalPrice: number;

  @Property({ type: () => GraphQLObjectId })
  shopId: ObjectId;

  @BelongsTo(() => User, {
    from: 'shopId',
  })
  shop: User;

  @HasMany(() => OrderItem, {
    to: 'orderId',
    allowCreateWithin: true,
    allowFindAll: true,
    allowPaginate: true,
  })
  orderItems: OrderItem[];

  @Property({ type: () => OrderStatus })
  status: OrderStatus;
}
