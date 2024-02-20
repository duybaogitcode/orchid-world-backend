import { InputType } from '@nestjs/graphql';

@InputType()
export class CartFindByGoogleId {
  googleId: string;
}
