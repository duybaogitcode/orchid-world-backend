import {
  BelongsTo,
  Definition,
  GraphQLObjectId,
  ObjectId,
  Property,
  ReferencesMany,
  Skip,
} from 'dryerjs';
import { BaseModel } from 'src/base/base.definition';
import { Tags } from './tags.definition';
import { Product } from 'src/product/product.definition';
@Definition({
  timestamps: true,
})
export class TagWithValues extends BaseModel() {
  @Property({ type: () => GraphQLObjectId, db: { unique: false } })
  tag_id: ObjectId;

  @BelongsTo(() => Tags, { from: 'tag_id', skipExistenceCheck: true })
  tag: Tags;

  @Property({ type: () => String })
  values: string;

  @Property({
    type: () => GraphQLObjectId,
    output: Skip,
    db: { unique: false },
  })
  product_id: ObjectId;

  @BelongsTo(() => Product, { from: 'product_id', noPopulation: true })
  product: Product;
}
