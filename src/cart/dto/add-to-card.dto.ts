import { Field, InputType, Int } from '@nestjs/graphql';

import { Types } from 'mongoose';

@InputType()
export class AddToCartDTO {
  @Field(() => String)
  productId: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => String)
  userId: Types.ObjectId;
}
