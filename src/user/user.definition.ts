import {
  BelongsTo,
  Definition,
  GraphQLObjectId,
  ObjectId,
  Property,
  Skip,
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
    },
    // update: Skip,
  })
  google_id: String;

  @Property()
  firstName: String;

  @Property()
  lastName: String;

  @Property({
    type: () => [String],
    nullable: true,
  })
  address: String[];

  @Property({})
  email: String;

  @Property({
    nullable: true,
  })
  phone: String;

  @Property()
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
