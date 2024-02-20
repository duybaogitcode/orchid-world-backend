import {
  BelongsTo,
  Definition,
  GraphQLObjectId,
  ObjectId,
  Property,
} from 'dryerjs';
import { Role } from 'src/auth/auth.definition';
import { BaseModel } from 'src/base/base.definition';

@Definition({
  timestamps: true,
})
export class User extends BaseModel() {
  @Property({
    db: {
      unique: true,
      index: true,
    },
    // update: Skip,
  })
  googleId: String;

  @Property()
  firstName: String;

  @Property()
  lastName: String;

  @Property({
    type: () => [String],
    nullable: true,
  })
  address: String[];

  @Property({
    db: {
      unique: true,
      index: true,
    },
  })
  email: String;

  @Property({
    nullable: true,
    db: {
      unique: true,
      index: true,

      default: null,
    },
  })
  phone: String;

  @Property({
    defaultValue: false,
  })
  isPhoneVerified: Boolean;

  @Property({
    nullable: true,
  })
  avatar: String;

  @Property({
    type: () => GraphQLObjectId,
  })
  roleId: ObjectId;

  @BelongsTo(() => Role, {
    from: 'roleId',
  })
  role: Role;
}
