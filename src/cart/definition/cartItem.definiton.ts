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

@Definition()
export class CartItem extends BaseModel() {
  @Property({ type: () => GraphQLObjectId })
  productId: ObjectId;

  @Embedded(() => Product)
  product: Product;

  @Property({ type: () => GraphQLObjectId })
  shopId: ObjectId;

  @Property({ type: () => GraphQLObjectId })
  cartId: ObjectId;

  @BelongsTo(() => Cart, {
    from: 'cartId',
  })
  cart: Cart;

  @BelongsTo(() => User, {
    from: 'shopId',
  })
  shop: User;

  @Property({ type: () => Number })
  quantity: number;

  @Property({ type: () => Number })
  totalPrice: number;

  @Property({ type: () => Boolean, defaultValue: true })
  isAvailableProduct: boolean;
}
