import {
  BelongsTo,
  Definition,
  GraphQLObjectId,
  ObjectId,
  Property,
} from 'dryerjs';
import { BaseModelHasOwner } from 'src/product/product.definition';
import { Order, OrderStatus } from './order.definition';

@Definition({
  timestamps: true,
})
export class OrderEvidence extends BaseModelHasOwner() {
  @Property({ type: () => String, nullable: true })
  media: string;

  @Property({ type: () => GraphQLObjectId })
  orderId: ObjectId;

  @BelongsTo(() => Order, { from: 'orderId' })
  order: Order;

  @Property({ type: () => OrderStatus })
  atStatus: OrderStatus;

  @Property({ type: () => String })
  description: string;
}
