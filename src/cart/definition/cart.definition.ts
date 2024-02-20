import { Definition, HasMany, Property } from 'dryerjs';
import { BaseModelHasOwner } from 'src/product/product.definition';
import { CartShopItem } from './cartShopItem.definition';

@Definition()
export class Cart extends BaseModelHasOwner({
  unique: true,
}) {
  @Property({
    type: () => Number,
    defaultValue: 0,
    db: {
      default: 0,
    },
  })
  totalQuantity: number;

  @Property({
    type: () => Number,
    defaultValue: 0,
    db: {
      default: 0,
    },
  })
  totalPrice: number;

  @HasMany(() => CartShopItem, {
    to: 'cartId',
    allowCreateWithin: true,
    allowFindAll: true,
  })
  CartShopItem: CartShopItem[];
}
