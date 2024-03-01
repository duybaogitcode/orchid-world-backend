import { InputType, PickType } from '@nestjs/graphql';
import { CreateInputType } from 'dryerjs';
import { User } from '../../user/user.definition';

const shopOwnerInput = CreateInputType(User);

@InputType()
export class ShopOwnerInput extends PickType(shopOwnerInput, [
  'shopOwner',
] as const) {}
