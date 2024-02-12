import { Field, ObjectType } from '@nestjs/graphql';
import {
  Definition,
  Embedded,
  GraphQLObjectId,
  HasMany,
  ObjectId,
  Property,
  ReferencesMany,
} from 'dryerjs';
import { BaseModel } from 'src/base/base.definition';

@Definition({
  timestamps: true,
})
export class Permission extends BaseModel() {
  @Property({ type: () => String, db: { unique: true } })
  pattern: string;
}

@Definition({
  timestamps: true,
})
export class Role extends BaseModel() {
  @Property({
    db: {
      unique: true,
    },
  })
  name: string;

  @Property({
    type: () => [GraphQLObjectId],
    nullable: true,
    db: { type: [ObjectId], default: [] },
  })
  permissionIds: ObjectId[];

  @ReferencesMany(() => Permission, {
    from: 'permissionIds',
    allowCreateWithin: true,
  })
  permissions: Permission[];
}
@Definition({
  timestamps: true,
})
export class Session extends BaseModel() {
  @Property({ type: () => GraphQLObjectId, db: { unique: true } })
  userId: ObjectId;

  @Property({ type: () => GraphQLObjectId, db: { unique: true } })
  private_key: string;

  @Property({ type: () => GraphQLObjectId, db: { unique: true } })
  public_key: string;

  blacklist: string[];
}

@ObjectType()
export class AccessTokenResponse {
  @Field()
  accessToken: string;
}
