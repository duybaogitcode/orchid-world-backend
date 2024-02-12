import { Field, ObjectType, registerEnumType } from '@nestjs/graphql';
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

@ObjectType()
export class Information {
  @Field()
  name: string;

  @Field()
  address: string;

  @Field()
  phone: string;

  @Field()
  email: string;

  @Field()
  avatar: string;
}
@Definition({
  timestamps: true,
})
export class User extends BaseModel() {
  @Property({
    type: () => GraphQLObjectId,
  })
  roleId: ObjectId;

  @BelongsTo(() => Role, {
    from: 'roleId',
  })
  role: Role;

  @Field(() => Information)
  information: Information;
}
