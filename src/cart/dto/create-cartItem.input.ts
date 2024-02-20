import { InputType, OmitType } from '@nestjs/graphql';
import { CreateInputType } from 'dryerjs';
import { CartItem } from '../definition/cartItem.definiton';

const cartItemInput = CreateInputType(CartItem);

@InputType()
export class CartItemInput extends OmitType(cartItemInput, [
  'cartShopItemId',
  'totalPrice',
] as const) {}
