import { Field, registerEnumType } from '@nestjs/graphql';
import {
  BelongsTo,
  Definition,
  Embedded,
  GraphQLObjectId,
  HasOne,
  ObjectId,
  Property,
  ReferencesMany,
  Skip,
} from 'dryerjs';
import { GraphQLUpload } from 'graphql-upload-ts';
import { BaseModel, Category, Tag } from 'src/base/base.definition';
import { User } from 'src/user/user.definition';

export const BaseModelHasOwner = () => {
  class BaseModelHasOwnerClass extends BaseModel() {
    @Property({
      type: () => GraphQLObjectId,
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

@Definition({ timestamps: true })
export class ProductType extends BaseModel() {
  @Property()
  name: string;

  @Property({ db: { unique: true } })
  slug: string;
}

@Definition({ timestamps: true })
export class Product extends BaseModelHasOwner() {
  @Property({ db: { unique: true } })
  name: string;

  @Property({ db: { unique: true } })
  slug: string;

  price: number;

  @Property({
    nullable: true,
  })
  shortDescription: string;

  @Property({
    nullable: true,
  })
  longDescription: string;

  // @Embedded(() => ProductType)
  // productType: ProductType;

  @ReferencesMany(() => Tag, { from: 'tagIds', allowCreateWithin: true })
  tags: Tag[];

  @HasOne(() => Category, {
    to: 'productId',
  })
  category: Category;

  @Property({
    nullable: true,
    type: () => [String],
  })
  media: string[];

  @Property({
    type: () => ProductStatus,
    nullable: true,
    defaultValue: ProductStatus.PENDING,
  })
  status: ProductStatus;
}
