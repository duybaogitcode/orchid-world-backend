import { registerEnumType } from '@nestjs/graphql';
import {
  BelongsTo,
  Definition,
  HasMany,
  HasOne,
  Property,
  ReferencesMany,
} from 'dryerjs';
import { GraphQLEnumType } from 'graphql';
import { BaseModel, Category, Tag } from 'src/base/base.definition';

type ProductStatusType =
  | 'PENDING'
  | 'APPROVED'
  | 'NOT_AVAILABLE'
  | 'DISAPPROVED';

enum ProductStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  DISAPPROVED = 'DISAPPROVED',
}

const ProductStatusEnum = new GraphQLEnumType({
  name: 'ProductStatus',
  values: {
    PENDING: { value: ProductStatus.PENDING },
    APPROVED: { value: ProductStatus.APPROVED },
    NOT_AVAILABLE: { value: ProductStatus.NOT_AVAILABLE },
    DISAPPROVED: { value: ProductStatus.DISAPPROVED },
  },
});

@Definition({ timestamps: true })
export class ProductType extends BaseModel() {
  @Property()
  name: string;

  @Property({ db: { unique: true } })
  slug: string;
}

@Definition({ timestamps: true })
export class Product extends BaseModel() {
  name: string;

  @Property({ db: { unique: true } })
  slug: string;

  authorId: string;

  price: number;

  @Property({
    nullable: true,
  })
  shortDescription: string;

  @Property({
    nullable: true,
  })
  longDescription: string;

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
    db: {
      type: 'string',
      enum: ProductStatus,
    },
  })
  status: string;
}
