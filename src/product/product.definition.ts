import { InputType, OmitType, registerEnumType } from '@nestjs/graphql';
import {
  BelongsTo,
  CreateInputType,
  Definition,
  Filterable,
  GraphQLObjectId,
  HasMany,
  Index,
  ObjectId,
  Property,
  Skip,
  Sortable,
} from 'dryerjs';
import { FileUpload, GraphQLUpload } from 'graphql-upload-ts';
import { BaseModel } from 'src/base/base.definition';
import { Feedbacks } from 'src/feedbacks/feedbacks.definition';
import { Categories } from 'src/orthersDef/categories.definition';
import { TagWithValues } from 'src/orthersDef/tagValues.definition';
import { User } from 'src/user/user.definition';

export const BaseModelHasOwner = (
  { unique }: { unique?: boolean } = { unique: false },
) => {
  class BaseModelHasOwnerClass extends BaseModel() {
    @Filterable(() => GraphQLObjectId, {
      operators: ['eq'],
    })
    @Property({
      type: () => GraphQLObjectId,
      create: Skip,
      update: Skip,
      db: {
        unique,
      },
    })
    authorId: ObjectId;

    @BelongsTo(() => User, { from: 'authorId' })
    author: User;
  }
  return BaseModelHasOwnerClass;
};

export enum ProductStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  DISAPPROVED = 'DISAPPROVED',
  REMOVED = 'REMOVED',
  SOLD = 'SOLD',
}
registerEnumType(ProductStatus, {
  name: 'ProductStatus',
});

// @Definition({ timestamps: true })
// export class ProductType extends BaseModel() {
//   @Property()
//   name: string;

//   @Property({ db: { unique: true } })
//   slug: string;
// }

const inputTags = CreateInputType(TagWithValues);
@InputType()
export class InputTags extends OmitType(inputTags, ['product_id'] as const) {}

@Definition({
  timestamps: true,
  enableTextSearch: true,
  schemaOptions: { selectPopulatedPaths: true },
})
export class Product extends BaseModelHasOwner() {
  @Filterable(() => String, { operators: ['contains'] })
  @Property()
  name: string;

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

  @Property({ db: { unique: true, sparse: true } })
  slug: string;

  @Property({ type: () => Number })
  @Sortable()
  price: number;

  @Property({ type: () => Number })
  quantity: number;

  @Property({
    nullable: true,
  })
  description: string;

  // @Embedded(() => ProductType)
  // productType: ProductType;
  @Filterable(() => ProductStatus, {
    operators: ['eq', 'in', 'notEq'],
  })
  @Property({
    type: () => ProductStatus,
    nullable: true,
    db: {
      default: ProductStatus.APPROVED,
    },
    create: Skip,
  })
  status: ProductStatus;

  @HasMany(() => TagWithValues, {
    to: 'product_id',
    allowCreateWithin: true,
    allowFindAll: true,
  })
  tags: TagWithValues[];

  @Filterable(() => String, {
    operators: ['eq'],
  })
  @Property({ type: () => GraphQLObjectId, output: Skip })
  category_id: ObjectId;

  @BelongsTo(() => Categories, { from: 'category_id' })
  category: Categories;

  @Property({
    type: () => [String],
    nullable: true,
    output: Skip,
    db: Skip,
    create: Skip,
  })
  deleteUrl: [string];

  @Property({
    type: () => [GraphQLUpload],
    db: Skip,
    output: Skip,
    create: Skip,
    nullable: true,
  })
  fileUpdate: Array<Promise<FileUpload>>;

  @Property({
    type: () => [InputTags],
    nullable: true,
    output: Skip,
    db: Skip,
    create: Skip,
  })
  tagsUpdate: TagWithValues[];

  @HasMany(() => Feedbacks, {
    to: 'productId',
    allowCreateWithin: true,
    allowFindAll: true,
  })
  feedback: Feedbacks[];

  @Sortable()
  @Property({ type: () => Number, nullable: true })
  rating: number;

  @Filterable(() => Boolean, {
    operators: ['eq', 'in', 'notIn', 'notEq'],
  })
  @Property({ type: () => Boolean, nullable: true, defaultValue: false })
  isAuction: boolean;
}
