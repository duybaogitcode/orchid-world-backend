import { Injectable } from '@nestjs/common';
import { Context } from 'src/auth/ctx';
import {
  AfterCreateHookInput,
  BaseService,
  InjectBaseService,
  ObjectId,
} from 'dryerjs';
import { Cart } from 'src/cart/definition/cart.definition';
import { Wallet } from 'src/wallet/wallet.definition';
import { CartItem } from '../definition/cartItem.definiton';
import { CartItemInput } from '../dto/create-cartItem.input';
import { CartShopItem } from './../definition/cartShopItem.definition';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class CartIShopItemService {
  constructor(
    @InjectBaseService(CartShopItem)
    public cartShopItemService: BaseService<CartIShopItemService, Context>,
    @InjectBaseService(Cart) public cartService: BaseService<Cart, Context>,
  ) {}

  @OnEvent('CartItem.added')
  async updateQuantityWhenCartItemCreated({
    input,
  }: AfterCreateHookInput<CartItem, Context>) {}
}
