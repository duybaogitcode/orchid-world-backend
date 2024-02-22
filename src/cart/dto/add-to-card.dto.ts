import { Field, InputType, Int } from '@nestjs/graphql';
import { CreateInputType, ObjectId, ObjectIdLike } from 'dryerjs';

import { Types, Schema } from 'mongoose';

@InputType()
export class AddToCartDTO {
  @Field(() => String)
  productId: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => String)
  userId: Types.ObjectId;
}
