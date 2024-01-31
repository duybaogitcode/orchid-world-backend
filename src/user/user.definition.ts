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
  firstName: string;
  lastName: string;
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
