import { Definition, HasMany, Property } from 'dryerjs';
import { BaseModelHasOwner } from 'src/product/product.definition';
import { CartShopItem } from './cartShopItem.definition';
import { CartItem } from './cartItem.definiton';

@Definition()
export class Cart extends BaseModelHasOwner({
  unique: true,
}) {
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

  @HasMany(() => CartShopItem, {
    to: 'cartId',
    allowCreateWithin: true,
    allowFindAll: true,
    allowPaginate: true,
  })
  cartShopItems: CartShopItem[];
}
