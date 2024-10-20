import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CartItemInput {
  @Field(() => String)
  productSlug: string;

  @Field(() => Number, { defaultValue: 1 })
  quantity: number;
}
