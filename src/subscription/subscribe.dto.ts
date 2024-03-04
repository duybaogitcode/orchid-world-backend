import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class SubscribeToSubscriptionDTO {
  @Field(() => String)
  planId: String;
}
