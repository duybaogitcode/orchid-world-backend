import { Definition, HasMany, Property } from 'dryerjs';
import { BaseModelHasOwner } from 'src/product/product.definition';
import { Order } from './order.definition';

@Definition({ timestamps: true })
export class OrderTransaction extends BaseModelHasOwner() {
  @HasMany(() => Order, {
    to: 'orderTransactionId',
    allowCreateWithin: true,
    allowFindAll: true,
  })
  orders: Order[];

  @Property({ type: () => Number })
  totalAmount: number;
}
