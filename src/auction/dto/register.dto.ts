import { Field, InputType } from '@nestjs/graphql';
import { GraphQLObjectId } from 'dryerjs';
import { Types } from 'mongoose';
@InputType()
export class AuctionRegisterDTO {
  @Field(() => GraphQLObjectId)
  auctionId: Types.ObjectId;
}

@InputType()
export class AuctionInputStop {
  @Field(() => GraphQLObjectId)
  auctionId: Types.ObjectId;

  @Field(() => String)
  stopReason: string;
}
