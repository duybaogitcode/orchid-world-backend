import { InputType, Int, Field } from '@nestjs/graphql';

@InputType()
export class CreatePaymentInput {
  @Field(() => Int)
  amount: number;

  @Field(() => String)
  paymentType: string;
}
