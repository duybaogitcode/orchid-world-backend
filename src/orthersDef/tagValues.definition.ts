import {
  BelongsTo,
  Definition,
  GraphQLObjectId,
  ObjectId,
  Property,
} from 'dryerjs';
import { BaseModel } from 'src/base/base.definition';
import { Tags } from './tags.definition';
import { Product } from 'src/product/product.definition';
@Definition({
  timestamps: true,
})
export class TagWithValues extends BaseModel() {
  @Property({ db: { unique: true } })
  name: string;

  @Property({ type: () => String })
  tag_slug: string;

  @Property({ type: () => String })
  values: string;

  @BelongsTo(() => Tags, { from: 'tag_slug' })
  tags: Tags;

  @Property({ type: () => GraphQLObjectId })
  product_id: ObjectId;

  @BelongsTo(() => Product, { from: 'product_id' })
  product: Product;
}
