import {
  BelongsTo,
  Definition,
  GraphQLObjectId,
  HasOne,
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
    type: () => String,
  })
  firstName: string;

  @Property({
    type: () => String,
  })
  lastName: string;

  @Property({
    type: () => String,
  })
  avatar: string;

  @Property({
    type: () => GraphQLObjectId,
  })
  roleId: ObjectId;

  @BelongsTo(() => Role, {
    from: 'roleId',
  })
  role: Role;
}
