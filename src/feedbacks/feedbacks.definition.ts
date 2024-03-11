import {
  BelongsTo,
  Definition,
  FilterType,
  Filterable,
  GraphQLObjectId,
  Property,
  Skip,
} from 'dryerjs';
import { FileUpload, GraphQLUpload } from 'graphql-upload-ts';
import { BaseModelHasOwner, Product } from 'src/product/product.definition';

Definition({
  timestamps: true,
});
export class Feedbacks extends BaseModelHasOwner() {
  @Property({ type: () => String, nullable: true })
  feedback: string;

  @Property({ type: () => String, nullable: true })
  rating: string;

  @Property({
    type: () => [String],
    nullable: true,
    create: Skip,
    db: { unique: false },
  })
  media: string[];

  @Property({
    type: () => [GraphQLUpload],
    db: Skip,
    output: Skip,
  })
  file: Array<Promise<FileUpload>>;

  @Property({ type: () => GraphQLObjectId })
  productId: string;

  @BelongsTo(() => Product, { from: 'productId' })
  product: Product;
}
