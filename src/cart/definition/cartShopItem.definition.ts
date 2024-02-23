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
import { User } from 'src/user/user.definition';

@Definition()
export class CartShopItem extends BaseModel() {
  @Property({ type: () => GraphQLObjectId })
  cartId: ObjectId;

  @BelongsTo(() => Cart, {
    from: 'cartId',
  })
  cart: Cart;

  @Property({ type: () => GraphQLObjectId })
  shopId: ObjectId;

  @BelongsTo(() => User, {
    from: 'shopId',
  })
  shop: User;

  @HasMany(() => CartItem, {
    to: 'cartShopItemId',
    allowCreateWithin: true,
    allowFindAll: true,
  })
  cartItem: CartItem[];

  @Property({ type: () => Number, defaultValue: 0 })
  totalQuantity: number;

  @Property({ type: () => Number, defaultValue: 0 })
  totalPrice: number;
}
