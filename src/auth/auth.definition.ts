import { Field, ObjectType } from '@nestjs/graphql';
import {
  Definition,
  GraphQLObjectId,
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

  @Property({ type: () => String, db: { unique: true } })
  refreshToken: string;

  @Property({ type: () => String, db: { unique: true } })
  accessToken: string;

  blacklist: string[];
}

@ObjectType()
export class AccessTokenResponse {
  @Field()
  accessToken: string;
}
