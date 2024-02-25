import { registerEnumType } from '@nestjs/graphql';
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
class RecipientInformation {
  @Property({ type: () => String })
  name: string;

  @Property({ type: () => String })
  phone: string;
}

@Definition({ timestamps: true })
export class Order extends BaseModel() {
  @Property({ type: () => String })
  note: string;

  @Property({ type: () => GraphQLObjectId, db: Skip, output: Skip })
  cartId: ObjectId;

  @Embedded(() => CartShopItem)
  orderItem: CartShopItem;

  @Embedded(() => RecipientInformation)
  recipientInformation: RecipientInformation;

  @Property({ type: () => OrderStatus, defaultValue: OrderStatus.PENDING })
  status: OrderStatus;

  @Property({ type: () => Number })
  shippingFee: number;

  @Property({ type: () => Number })
  amount: number;

  @Property({
    type: () => GraphQLObjectId,
    output: Skip,
  })
  orderTransactionId: ObjectId;

  @BelongsTo(() => OrderTransaction, {
    from: 'orderTransactionId',
    noPopulation: true,
  })
  orderTransaction: OrderTransaction;
}
