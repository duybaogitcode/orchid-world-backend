import { Field, InputType } from '@nestjs/graphql';
import { GraphQLObjectId, ObjectId } from 'dryerjs';
import { Types } from 'mongoose';
@InputType()
export class UpdateRoleDTO {
  @Field(() => GraphQLObjectId)
  userId: ObjectId;

  @Field(() => GraphQLObjectId)
  roleId: ObjectId;
}
