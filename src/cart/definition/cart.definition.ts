import { Definition, HasMany, Property } from 'dryerjs';
import { BaseModelHasOwner } from 'src/product/product.definition';
import { CartShopItem } from './cartShopItem.definition';

@Definition()
export class Cart extends BaseModelHasOwner() {
  @Property({ type: () => Number })
  totalQuantity: number;

  @Property({ type: () => Number })
  totalPrice: number;

  @HasMany(() => CartShopItem, {
    to: 'cartId',
    allowCreateWithin: true,
    allowFindAll: true,
  })
  CartShopItem: CartShopItem[];
}
