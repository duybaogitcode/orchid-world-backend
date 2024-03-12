import { GraphQLISODateTime, Int } from '@nestjs/graphql';
import {
  BelongsTo,
  Definition,
  FilterType,
  Filterable,
  GraphQLObjectId,
  Id,
  ObjectId,
  Property,
  Skip,
  Sortable,
} from 'dryerjs';
import { FileUpload, GraphQLUpload } from 'graphql-upload-ts';
import { BaseModelHasOwner, Product } from 'src/product/product.definition';
import { User } from 'src/user/user.definition';

@Definition({
  timestamps: true,
})
export class Feedbacks {
  @Id()
  id: ObjectId;

  @Property({ type: () => String, nullable: true })
  feedback: string;

  @Property({ type: () => Int, nullable: true })
  rating: number;

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
  productId: ObjectId;

  @BelongsTo(() => Product, { from: 'productId' })
  product: Product;

  @Property({
    type: () => GraphQLObjectId,
    create: Skip,
    update: Skip,
  })
  authorId: ObjectId;

  @BelongsTo(() => User, { from: 'authorId' })
  author: User;

  @Sortable()
  @Property({
    output: { type: () => GraphQLISODateTime },
    create: Skip,
    update: Skip,
  })
  createdAt: Date;

  @Sortable()
  @Property({
    output: { type: () => GraphQLISODateTime },
    create: Skip,
    update: Skip,
  })
  updatedAt: Date;
}
