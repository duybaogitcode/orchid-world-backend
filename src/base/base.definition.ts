import { GraphQLISODateTime } from '@nestjs/graphql';
import {
  Definition,
  GraphQLObjectId,
  Id,
  ObjectId,
  Property,
  Skip,
} from 'dryerjs';

export const BaseModel = () => {
  class BaseModelAsClass {
    @Id()
    id: ObjectId;

    @Property({
      output: { type: () => GraphQLISODateTime },
      create: Skip,
      update: Skip,
    })
    createdAt: Date;

    @Property({
      output: { type: () => GraphQLISODateTime },
      create: Skip,
      update: Skip,
    })
    updatedAt: Date;
  }
  return BaseModelAsClass;
};

@Definition({ timestamps: true })
export class Category extends BaseModel() {
  @Property()
  name: string;

  @Property({ db: { unique: true } })
  slug: string;

  @Property({
    nullable: true,
  })
  description: string;

  @Property({
    nullable: true,
    type: () => [String],
  })
  media: string[];

  @Property({
    type: () => GraphQLObjectId,
  })
  productId: ObjectId;
}

@Definition({ timestamps: true })
export class Tag extends BaseModel() {
  @Property()
  name: string;

  @Property({ db: { unique: true } })
  slug: string;

  @Property({
    type: () => GraphQLObjectId,
  })
  productId: ObjectId;
}
