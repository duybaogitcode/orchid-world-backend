import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class WithdrawPaypalInput {
  @Field(() => Number)
  amount: number;

  @Field(() => String)
  payPalUserName: string;
}
