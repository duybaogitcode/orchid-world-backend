import { InputType, Field } from '@nestjs/graphql';
import { GraphQLObjectId, ObjectId } from 'dryerjs';

@InputType()
export class CreateUserDTO {
  @Field(() => String, { description: 'First Name' })
  firstName: string;

  @Field(() => String, { description: 'Last Name' })
  lastName: string;

  @Field(() => String, { description: 'Phone' })
  phone: string;

  @Field(() => String, { description: 'Email' })
  email: string;

  @Field(() => String, { description: 'Password' })
  password: string;

  @Field(() => GraphQLObjectId, { description: 'Role Id' })
  roleId: ObjectId;
}
