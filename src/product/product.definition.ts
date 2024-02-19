import { registerEnumType } from '@nestjs/graphql';
import { Prop } from '@nestjs/mongoose';
import {
  BelongsTo,
  Definition,
  GraphQLObjectId,
  HasMany,
  ObjectId,
  Property,
  Skip,
} from 'dryerjs';
import { FileUpload, GraphQLUpload } from 'graphql-upload-ts';
import { BaseModel } from 'src/base/base.definition';
import { Categories } from 'src/orthersDef/categories.definition';
import { TagWithValues } from 'src/orthersDef/tagValues.definition';
import { User } from 'src/user/user.definition';

export const BaseModelHasOwner = () => {
  class BaseModelHasOwnerClass extends BaseModel() {
    @Property({
      type: () => GraphQLObjectId,
      create: Skip,
      update: Skip,
      output: Skip,
    })
    authorId: ObjectId;

    @BelongsTo(() => User, { from: 'authorId' })
    author: User;
  }
  return BaseModelHasOwnerClass;
};

enum ProductStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  DISAPPROVED = 'DISAPPROVED',
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

@Definition({ timestamps: true })
export class Product extends BaseModelHasOwner() {
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

  @Property({ db: { unique: true } })
  slug: string;

  @Property({ type: () => Number })
  price: number;

  @Property({ type: () => Number })
  quantity: number;

  @Property({
    nullable: true,
  })
  description: string;

  // @Embedded(() => ProductType)
  // productType: ProductType;

  @Property({
    type: () => ProductStatus,
    nullable: true,
    defaultValue: ProductStatus.PENDING,
    create: Skip,
  })
  status: ProductStatus;

  @HasMany(() => TagWithValues, {
    to: 'product_id',
    allowCreateWithin: true,
    allowFindAll: true,
  })
  tags: TagWithValues[];

  @Property({ type: () => GraphQLObjectId, output: Skip })
  category_id: ObjectId;

  @BelongsTo(() => Categories, { from: 'category_id' })
  category: Categories;
}
