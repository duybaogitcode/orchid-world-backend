import { Field, InputType } from '@nestjs/graphql';
import { GraphQLObjectId } from 'dryerjs';
import { Types } from 'mongoose';

@InputType()
export class SubscribeToSubscriptionDTO {
  @Field(() => String)
  planId: string;
}
