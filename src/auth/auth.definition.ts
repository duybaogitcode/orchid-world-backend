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
  @Property({ type: () => String })
  pattern: string;
}

@Definition({
  timestamps: true,
})
export class Role extends BaseModel() {
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
  @Property({ type: () => GraphQLObjectId })
  userId: ObjectId;

  private_key: string;

  public_key: string;

  blacklist: string[];
}
