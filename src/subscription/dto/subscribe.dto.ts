import { Field, InputType } from '@nestjs/graphql';
import { GraphQLObjectId } from 'dryerjs';
import { Types } from 'mongoose';

@InputType()
export class SubscribeToSubscriptionDTO {
  @Field(() => String)
  planId: String;

  @Field(() => GraphQLObjectId)
  transactionId: Types.ObjectId;
}
