import { GraphQLISODateTime, registerEnumType } from '@nestjs/graphql';
import {
  BelongsTo,
  Definition,
  GraphQLObjectId,
  Id,
  ObjectId,
  Property,
  Skip,
} from 'dryerjs';
import { User } from 'src/user/user.definition';
export enum BaseStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  DISAPPROVED = 'DISAPPROVED',
}

registerEnumType(BaseStatus, {
  name: 'Status',
});

export const BaseModel = () => {
  class BaseModelAsClass {
    @Id()
    id: ObjectId;

    @Property({
      output: { type: () => GraphQLISODateTime },
    })
    createdAt: Date;

    @Property({
      output: { type: () => GraphQLISODateTime },
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
