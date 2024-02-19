import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class LoginInput {
  @Field(() => String, { description: 'Firebase Id Token' })
  idToken: string;
}
