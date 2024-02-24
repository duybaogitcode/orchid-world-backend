import { InputType, PickType } from '@nestjs/graphql';
import { CreateInputType } from 'dryerjs';
import { CartShopItem } from 'src/cart/definition/cartShopItem.definition';

const cartShopItemInputType = CreateInputType(CartShopItem);
@InputType()
export class CreateOrderDto extends PickType(cartShopItemInputType, [
  'cartId',
]) {}
