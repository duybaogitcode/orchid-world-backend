import {
  BelongsTo,
  Definition,
  Embedded,
  GraphQLObjectId,
  ObjectId,
  Property,
} from 'dryerjs';
import { Product } from 'src/product/product.definition';
import { BaseModel } from 'src/base/base.definition';
import { User } from 'src/user/user.definition';
import { Cart } from './cart.definition';
import { CartShopItem } from './cartShopItem.definition';

@Definition()
export class CartItem extends BaseModel() {
  @Property({ type: () => GraphQLObjectId })
  productId: ObjectId;

  @BelongsTo(() => Product, {
    from: 'productId',
  })
  product: Product;

  @Property({ type: () => GraphQLObjectId })
  cartShopItemId: ObjectId;

  @BelongsTo(() => Cart, {
    from: 'cart',
    noPopulation: true,
  })
  cartShopItem: CartShopItem;

  @Property({ type: () => Number })
  quantity: number;

  @Property({ type: () => Number })
  totalPrice: number;

  @Property({ type: () => Boolean, defaultValue: true })
  isAvailableProduct: boolean;
}
