import {
  Definition,
  GraphQLObjectId,
  HasMany,
  ObjectId,
  Property,
  ReferencesMany,
  Skip,
} from 'dryerjs';
import { BaseModel } from 'src/base/base.definition';
import { Product } from 'src/product/product.definition';
@Definition({
  timestamps: true,
})
export class Categories extends BaseModel() {
  @Property({ db: { unique: true } })
  name: string;

  @Property({ db: { unique: true } })
  slug: string;

  @HasMany(() => Product, {
    to: 'category_id',
    allowCreateWithin: false,
    allowFindAll: true,
    allowPaginate: true,
  })
  product: Product[];
}
