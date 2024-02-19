import { Definition, HasMany, Property } from 'dryerjs';
import { BaseModelHasOwner } from 'src/product/product.definition';
import { CartItem } from './cartItem.definiton';

@Definition()
export class Cart extends BaseModelHasOwner() {
  @HasMany(() => CartItem, {
    to: 'cartId',
    allowFindAll: true,
    allowPaginate: true,
  })
  cartItems: CartItem[];

  @Property({ type: Number })
  totalQuantity: number;

  @Property({ type: Number })
  totalPrice: number;
}
