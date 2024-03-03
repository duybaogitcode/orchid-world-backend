import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class WithdrawPaypalInput {
  @Field(() => String)
  totalWithDraw: string;

  @Field(() => String)
  payPalUserName: string;
}
