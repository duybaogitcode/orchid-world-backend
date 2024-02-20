import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class GetByUidInput {
  @Field(() => String)
  googleId: string;
}
