import {
  BelongsTo,
  Definition,
  GraphQLObjectId,
  HasMany,
  ObjectId,
  Property,
} from 'dryerjs';
import { BaseModel } from 'src/base/base.definition';
import { Cart } from './cart.definition';
import { CartItem } from './cartItem.definiton';

@Definition()
export class CartShopItem extends BaseModel() {
  @Property({ type: () => GraphQLObjectId })
  cartId: ObjectId;

  @HasMany(() => CartItem, {
    to: 'cartShopItemId',
    allowCreateWithin: true,
    allowFindAll: true,
  })
  cartItem: CartItem[];

  @Property({ type: () => Number })
  totalQuantity: number;

  @Property({ type: () => Number })
  totalPrice: number;
}
