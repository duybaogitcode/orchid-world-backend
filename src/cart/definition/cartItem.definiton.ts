import {
  BelongsTo,
  Definition,
  GraphQLObjectId,
  ObjectId,
  Property,
} from 'dryerjs';
import { Product } from 'src/product/product.definition';
import { BaseModel } from 'src/base/base.definition';

@Definition()
export class CartItem extends BaseModel() {
  @Property({ type: () => GraphQLObjectId })
  productId: ObjectId;

  @BelongsTo(() => Product, { from: 'productId' })
  product: Product;

  @Property({ type: () => Number })
  quantity: number;

  @Property({ type: () => Number })
  totalPrice: number;

  @Property({ type: () => Boolean, defaultValue: true })
  isAvailableProduct: boolean;

  @Property({ type: () => GraphQLObjectId })
  cartShopItemId: ObjectId;
}
